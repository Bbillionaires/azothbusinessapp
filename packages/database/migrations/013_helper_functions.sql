-- ============================================================
-- Migration 013: Helper Functions & Stored Procedures
-- ============================================================

-- ============================================================
-- GENERIC UTILITIES
-- ============================================================

-- Increment a numeric column safely
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER LANGUAGE SQL AS $$
  SELECT COALESCE(x, 0) + 1;
$$;

CREATE OR REPLACE FUNCTION increment_by(x NUMERIC, amount NUMERIC)
RETURNS NUMERIC LANGUAGE SQL AS $$
  SELECT COALESCE(x, 0) + COALESCE(amount, 0);
$$;

-- Generate a short unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  attempt INT := 0;
BEGIN
  LOOP
    -- Take first 8 chars of user_id + random suffix
    base_code := UPPER(
      SUBSTRING(REPLACE(user_id::TEXT, '-', ''), 1, 6) ||
      SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)
    );
    final_code := base_code;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM referral_links WHERE code = final_code) THEN
      RETURN final_code;
    END IF;

    attempt := attempt + 1;
    IF attempt > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Auto-create referral link and profile on new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  -- Generate referral code
  ref_code := generate_referral_code(NEW.id);

  -- Insert profile
  INSERT INTO public.profiles (
    id, email, full_name, avatar_url, role, referral_code,
    points_balance, total_points_earned, tier
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'consumer',
    ref_code,
    0, 0, 'bronze'
  );

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, notifications_enabled, email_notifications, push_notifications, marketing_emails)
  VALUES (NEW.id, true, true, true, false);

  -- Create referral link
  INSERT INTO public.referral_links (user_id, code, clicks, conversions, earnings)
  VALUES (NEW.id, ref_code, 0, 0, 0);

  -- Initialize spending streak
  INSERT INTO public.spending_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- BUSINESS SLUG GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT, business_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert name to URL-safe slug
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := LEFT(base_slug, 50);

  final_slug := base_slug;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug AND id != business_id) THEN
      RETURN final_slug;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_business_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_slug_trigger ON businesses;
CREATE TRIGGER business_slug_trigger
  BEFORE INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_business_slug();

-- ============================================================
-- LEADERBOARD QUERIES (used by compute-analytics)
-- ============================================================

CREATE OR REPLACE FUNCTION leaderboard_spending(p_since TIMESTAMPTZ DEFAULT '2020-01-01')
RETURNS TABLE(user_id UUID, score NUMERIC)
LANGUAGE SQL STABLE AS $$
  SELECT r.user_id, SUM(r.total)::NUMERIC as score
  FROM receipts r
  WHERE r.status = 'approved' AND r.created_at >= p_since
  GROUP BY r.user_id
  ORDER BY score DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION leaderboard_referrals(p_since TIMESTAMPTZ DEFAULT '2020-01-01')
RETURNS TABLE(user_id UUID, score NUMERIC)
LANGUAGE SQL STABLE AS $$
  SELECT re.referrer_id as user_id, COUNT(*)::NUMERIC as score
  FROM referral_events re
  WHERE re.status = 'completed' AND re.created_at >= p_since
  GROUP BY re.referrer_id
  ORDER BY score DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION leaderboard_reviews(p_since TIMESTAMPTZ DEFAULT '2020-01-01')
RETURNS TABLE(user_id UUID, score NUMERIC)
LANGUAGE SQL STABLE AS $$
  SELECT r.reviewer_id as user_id, COUNT(*)::NUMERIC as score
  FROM reviews r
  WHERE r.status = 'published' AND r.created_at >= p_since
  GROUP BY r.reviewer_id
  ORDER BY score DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION leaderboard_impact(p_since TIMESTAMPTZ DEFAULT '2020-01-01')
RETURNS TABLE(user_id UUID, score NUMERIC)
LANGUAGE SQL STABLE AS $$
  SELECT cl.user_id, cl.impact_score::NUMERIC as score
  FROM community_legends cl
  ORDER BY score DESC
  LIMIT 100;
$$;

-- ============================================================
-- CITY SPENDING AGGREGATION
-- ============================================================

CREATE OR REPLACE FUNCTION city_spending_total(p_city TEXT, p_start DATE, p_end DATE)
RETURNS NUMERIC LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(SUM(r.total), 0)::NUMERIC
  FROM receipts r
  JOIN businesses b ON b.name = r.merchant_name
  WHERE b.city = p_city
    AND r.status = 'approved'
    AND r.receipt_date BETWEEN p_start AND p_end;
$$;

-- ============================================================
-- BUSINESS STATISTICS VIEW
-- ============================================================

CREATE OR REPLACE VIEW business_stats AS
SELECT
  b.id,
  b.name,
  b.city,
  b.status,
  b.verification_level,
  COUNT(DISTINCT bf.user_id) AS follower_count,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(
    SUM(r.rating * r.weight) / NULLIF(SUM(r.weight), 0),
    0
  ) AS weighted_rating,
  COUNT(DISTINCT jp.id) AS open_jobs,
  COUNT(DISTINCT e.id) AS upcoming_events,
  COUNT(DISTINCT rec.id) AS receipt_count_90d
FROM businesses b
LEFT JOIN business_followers bf ON bf.business_id = b.id
LEFT JOIN reviews r ON r.business_id = b.id AND r.status = 'published'
LEFT JOIN job_postings jp ON jp.business_id = b.id AND jp.is_active = true
LEFT JOIN events e ON e.business_id = b.id AND e.status = 'published' AND e.start_at > NOW()
LEFT JOIN receipts rec ON rec.merchant_name = b.name AND rec.created_at > NOW() - INTERVAL '90 days'
GROUP BY b.id;

-- ============================================================
-- SEARCH BUSINESSES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION search_businesses(
  p_query TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  p_radius_km DOUBLE PRECISION DEFAULT 25,
  p_is_local_owned BOOLEAN DEFAULT NULL,
  p_is_community_owned BOOLEAN DEFAULT NULL,
  p_is_veteran_owned BOOLEAN DEFAULT NULL,
  p_is_woman_owned BOOLEAN DEFAULT NULL,
  p_is_nonprofit_owned BOOLEAN DEFAULT NULL,
  p_hiring_now BOOLEAN DEFAULT NULL,
  p_has_free_today BOOLEAN DEFAULT NULL,
  p_has_upcoming_event BOOLEAN DEFAULT NULL,
  p_verification_levels TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  website TEXT,
  average_rating NUMERIC,
  total_reviews INT,
  verification_level TEXT,
  is_local_owned BOOLEAN,
  is_community_owned BOOLEAN,
  is_veteran_owned BOOLEAN,
  is_woman_owned BOOLEAN,
  is_nonprofit_owned BOOLEAN,
  is_featured BOOLEAN,
  is_top_rated BOOLEAN,
  hiring_now BOOLEAN,
  has_free_today BOOLEAN,
  has_upcoming_event BOOLEAN,
  year_founded INT,
  referral_percentage NUMERIC,
  referral_fixed_amount NUMERIC,
  distance_km DOUBLE PRECISION
)
LANGUAGE SQL STABLE AS $$
  SELECT
    b.id, b.name, b.slug, b.description, b.category,
    b.city, b.state, b.address, b.latitude, b.longitude,
    b.logo_url, b.cover_url, b.phone, b.website,
    b.average_rating, b.total_reviews, b.verification_level,
    b.is_local_owned, b.is_community_owned, b.is_veteran_owned,
    b.is_woman_owned, b.is_nonprofit_owned,
    b.is_featured, b.is_top_rated, b.hiring_now,
    b.has_free_today, b.has_upcoming_event,
    b.year_founded, b.referral_percentage, b.referral_fixed_amount,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
      THEN (
        6371 * acos(
          cos(radians(p_lat)) * cos(radians(b.latitude)) *
          cos(radians(b.longitude) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(b.latitude))
        )
      )
      ELSE NULL
    END AS distance_km
  FROM businesses b
  WHERE
    b.status = 'active'
    AND (p_query IS NULL OR (
      b.name ILIKE '%' || p_query || '%' OR
      b.description ILIKE '%' || p_query || '%' OR
      b.category ILIKE '%' || p_query || '%' OR
      b.tags::TEXT ILIKE '%' || p_query || '%'
    ))
    AND (p_city IS NULL OR b.city ILIKE p_city)
    AND (p_category IS NULL OR b.category = p_category)
    AND (p_is_local_owned IS NULL OR b.is_local_owned = p_is_local_owned)
    AND (p_is_community_owned IS NULL OR b.is_community_owned = p_is_community_owned)
    AND (p_is_veteran_owned IS NULL OR b.is_veteran_owned = p_is_veteran_owned)
    AND (p_is_woman_owned IS NULL OR b.is_woman_owned = p_is_woman_owned)
    AND (p_is_nonprofit_owned IS NULL OR b.is_nonprofit_owned = p_is_nonprofit_owned)
    AND (p_hiring_now IS NULL OR b.hiring_now = p_hiring_now)
    AND (p_has_free_today IS NULL OR b.has_free_today = p_has_free_today)
    AND (p_has_upcoming_event IS NULL OR b.has_upcoming_event = p_has_upcoming_event)
    AND (p_verification_levels IS NULL OR b.verification_level = ANY(p_verification_levels))
    AND (
      p_lat IS NULL OR p_lng IS NULL OR b.latitude IS NULL OR b.longitude IS NULL OR
      (
        6371 * acos(
          cos(radians(p_lat)) * cos(radians(b.latitude)) *
          cos(radians(b.longitude) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(b.latitude))
        )
      ) <= p_radius_km
    )
  ORDER BY
    b.is_featured DESC,
    b.verification_level DESC,
    b.average_rating DESC NULLS LAST,
    distance_km ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================================
-- USER IMPACT COMPUTATION (full version)
-- ============================================================

CREATE OR REPLACE FUNCTION compute_user_impact_snapshot(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_period_end DATE := CURRENT_DATE;
  v_dollars_spent NUMERIC := 0;
  v_businesses INT := 0;
  v_local_jobs INT := 0;
  v_events INT := 0;
  v_new_businesses INT := 0;
  v_community_businesses INT := 0;
BEGIN
  -- Total local spending this month
  SELECT COALESCE(SUM(r.total), 0) INTO v_dollars_spent
  FROM receipts r
  WHERE r.user_id = p_user_id
    AND r.status = 'approved'
    AND r.receipt_date BETWEEN v_period_start AND v_period_end;

  -- Unique businesses supported (by receipt)
  SELECT COUNT(DISTINCT r.merchant_name) INTO v_businesses
  FROM receipts r
  WHERE r.user_id = p_user_id
    AND r.status = 'approved'
    AND r.receipt_date BETWEEN v_period_start AND v_period_end;

  -- Events attended this month
  SELECT COUNT(*) INTO v_events
  FROM event_rsvps er
  JOIN events e ON e.id = er.event_id
  WHERE er.user_id = p_user_id
    AND er.status = 'going'
    AND e.start_at::DATE BETWEEN v_period_start AND v_period_end;

  -- New businesses supported (founded <3 years ago)
  SELECT COUNT(DISTINCT b.id) INTO v_new_businesses
  FROM receipts r
  JOIN businesses b ON b.name = r.merchant_name AND b.status = 'active'
  WHERE r.user_id = p_user_id
    AND r.status = 'approved'
    AND r.receipt_date BETWEEN v_period_start AND v_period_end
    AND b.year_founded >= EXTRACT(YEAR FROM CURRENT_DATE) - 3;

  -- Community-owned businesses supported
  SELECT COUNT(DISTINCT b.id) INTO v_community_businesses
  FROM receipts r
  JOIN businesses b ON b.name = r.merchant_name AND b.status = 'active'
  WHERE r.user_id = p_user_id
    AND r.status = 'approved'
    AND r.receipt_date BETWEEN v_period_start AND v_period_end
    AND b.is_community_owned = true;

  -- Upsert the snapshot
  INSERT INTO local_impact_snapshots (
    user_id, period_start, period_end,
    dollars_spent_local, businesses_supported,
    local_jobs_supported, events_attended,
    new_businesses_supported, community_businesses_supported
  ) VALUES (
    p_user_id, v_period_start, v_period_end,
    v_dollars_spent, v_businesses,
    v_local_jobs, v_events,
    v_new_businesses, v_community_businesses
  )
  ON CONFLICT (user_id, period_start) DO UPDATE SET
    dollars_spent_local = EXCLUDED.dollars_spent_local,
    businesses_supported = EXCLUDED.businesses_supported,
    events_attended = EXCLUDED.events_attended,
    new_businesses_supported = EXCLUDED.new_businesses_supported,
    community_businesses_supported = EXCLUDED.community_businesses_supported;

  -- Update community legend impact score
  UPDATE community_legends SET
    local_spending_total = (
      SELECT COALESCE(SUM(total), 0) FROM receipts
      WHERE user_id = p_user_id AND status = 'approved'
    ),
    impact_score = (
      SELECT COALESCE(SUM(total), 0) * 1 +  -- $1 = 1 point
             (SELECT COUNT(*) FROM referral_events WHERE referrer_id = p_user_id AND status = 'completed') * 10 +
             (SELECT COUNT(*) FROM reviews WHERE reviewer_id = p_user_id AND status = 'published') * 5 +
             (SELECT COUNT(*) FROM event_rsvps WHERE user_id = p_user_id AND status = 'going') * 2
      FROM receipts WHERE user_id = p_user_id AND status = 'approved'
    )
  WHERE user_id = p_user_id;

END;
$$;

-- ============================================================
-- BUSINESS ANALYTICS VIEW (for business portal dashboard)
-- ============================================================

CREATE OR REPLACE VIEW business_analytics AS
SELECT
  b.id as business_id,
  b.name,
  b.owner_id,
  -- This month receipts
  COUNT(DISTINCT CASE WHEN r.receipt_date >= DATE_TRUNC('month', CURRENT_DATE)
    THEN r.id END) AS receipts_this_month,
  COALESCE(SUM(CASE WHEN r.receipt_date >= DATE_TRUNC('month', CURRENT_DATE) AND r.status = 'approved'
    THEN r.total END), 0) AS revenue_this_month,
  -- Followers
  COUNT(DISTINCT bf.user_id) AS follower_count,
  -- Reviews
  COUNT(DISTINCT rv.id) AS review_count,
  COALESCE(SUM(rv.rating * rv.weight)::NUMERIC / NULLIF(SUM(rv.weight), 0), 0) AS weighted_rating,
  -- Active jobs
  COUNT(DISTINCT CASE WHEN jp.is_active THEN jp.id END) AS active_jobs,
  -- Upcoming events
  COUNT(DISTINCT CASE WHEN e.start_at > NOW() AND e.status = 'published' THEN e.id END) AS upcoming_events,
  -- Referral earnings this month
  COALESCE(SUM(CASE WHEN re.created_at >= DATE_TRUNC('month', CURRENT_DATE) AND re.status = 'completed'
    THEN re.amount * b.referral_percentage / 100 END), 0) AS referral_earnings_this_month
FROM businesses b
LEFT JOIN receipts r ON r.merchant_name = b.name
LEFT JOIN business_followers bf ON bf.business_id = b.id
LEFT JOIN reviews rv ON rv.business_id = b.id AND rv.status = 'published'
LEFT JOIN job_postings jp ON jp.business_id = b.id
LEFT JOIN events e ON e.business_id = b.id
LEFT JOIN referral_events re ON re.referred_id = b.owner_id
GROUP BY b.id;
