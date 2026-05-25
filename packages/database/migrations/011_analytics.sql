-- =============================================================================
-- Migration 011: Analytics — Local impact snapshots and economic dashboards
-- =============================================================================

-- ---------------------------------------------------------------------------
-- local_impact_snapshots
-- Per-user periodic local economic impact summary
-- ---------------------------------------------------------------------------
CREATE TABLE public.local_impact_snapshots (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start                  DATE NOT NULL,
  period_end                    DATE NOT NULL,

  -- Economic impact metrics
  dollars_spent_local           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  dollars_spent_community       NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- community-owned subset
  businesses_supported          INTEGER NOT NULL DEFAULT 0 CHECK (businesses_supported >= 0),
  unique_categories_shopped     INTEGER NOT NULL DEFAULT 0,

  -- Employment impact (est. based on receipt patterns)
  local_jobs_supported          NUMERIC(8,2) NOT NULL DEFAULT 0.00,   -- fractional jobs estimate

  -- Community engagement
  events_attended               INTEGER NOT NULL DEFAULT 0 CHECK (events_attended >= 0),
  reviews_written               INTEGER NOT NULL DEFAULT 0 CHECK (reviews_written >= 0),
  referrals_made                INTEGER NOT NULL DEFAULT 0 CHECK (referrals_made >= 0),

  -- Discovery stats
  new_businesses_supported      INTEGER NOT NULL DEFAULT 0 CHECK (new_businesses_supported >= 0),
  community_businesses_supported INTEGER NOT NULL DEFAULT 0 CHECK (community_businesses_supported >= 0),
  veteran_businesses_supported  INTEGER NOT NULL DEFAULT 0 CHECK (veteran_businesses_supported >= 0),
  woman_businesses_supported    INTEGER NOT NULL DEFAULT 0 CHECK (woman_businesses_supported >= 0),

  -- Points this period
  points_earned                 INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  points_redeemed               INTEGER NOT NULL DEFAULT 0 CHECK (points_redeemed >= 0),

  -- Carbon / sustainability (future use)
  co2_offset_lbs               NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT snapshot_period_valid CHECK (period_end >= period_start),
  UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX idx_impact_user        ON public.local_impact_snapshots(user_id);
CREATE INDEX idx_impact_period      ON public.local_impact_snapshots(period_start, period_end);
CREATE INDEX idx_impact_spending    ON public.local_impact_snapshots(dollars_spent_local DESC);
CREATE INDEX idx_impact_created     ON public.local_impact_snapshots(created_at DESC);

ALTER TABLE public.local_impact_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "impact: user reads own"
  ON public.local_impact_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "impact: admins full access"
  ON public.local_impact_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- economic_dashboard_data
-- Aggregated city-level economic activity data for the admin dashboard
-- ---------------------------------------------------------------------------
CREATE TABLE public.economic_dashboard_data (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city                     TEXT NOT NULL,
  state                    TEXT NOT NULL,
  period_start             DATE NOT NULL,
  period_end               DATE NOT NULL,
  period_type              TEXT NOT NULL DEFAULT 'monthly', -- 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

  -- Volume metrics
  total_local_spending     NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_community_spending NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  receipt_volume           INTEGER NOT NULL DEFAULT 0,
  average_receipt_value    NUMERIC(10,2),

  -- Business health
  new_businesses           INTEGER NOT NULL DEFAULT 0,
  total_active_businesses  INTEGER NOT NULL DEFAULT 0,
  businesses_hiring        INTEGER NOT NULL DEFAULT 0,
  job_postings             INTEGER NOT NULL DEFAULT 0,

  -- Platform activity
  reward_redemptions       INTEGER NOT NULL DEFAULT 0,
  rewards_value_redeemed   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  events_held              INTEGER NOT NULL DEFAULT 0,
  event_attendees          INTEGER NOT NULL DEFAULT 0,

  -- Consumer metrics
  active_consumers         INTEGER NOT NULL DEFAULT 0,
  new_consumers            INTEGER NOT NULL DEFAULT 0,
  avg_spending_per_consumer NUMERIC(10,2),

  -- Referral economy
  referral_conversions     INTEGER NOT NULL DEFAULT 0,
  referral_earnings        NUMERIC(12,2) NOT NULL DEFAULT 0.00,

  -- Growth indicators (vs previous period)
  spending_growth_pct      NUMERIC(6,2),
  consumer_growth_pct      NUMERIC(6,2),
  business_growth_pct      NUMERIC(6,2),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT dashboard_period_valid CHECK (period_end >= period_start),
  UNIQUE (city, state, period_start, period_end, period_type)
);

CREATE INDEX idx_dashboard_city        ON public.economic_dashboard_data(city, state);
CREATE INDEX idx_dashboard_period      ON public.economic_dashboard_data(period_start, period_end);
CREATE INDEX idx_dashboard_period_type ON public.economic_dashboard_data(period_type);
CREATE INDEX idx_dashboard_created     ON public.economic_dashboard_data(created_at DESC);

ALTER TABLE public.economic_dashboard_data ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write dashboard data
CREATE POLICY "dashboard: admins only"
  ON public.economic_dashboard_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_dashboard_updated_at
  BEFORE UPDATE ON public.economic_dashboard_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- business_analytics
-- Aggregated performance metrics per business per period
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_analytics (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id            UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_start           DATE NOT NULL,
  period_end             DATE NOT NULL,
  period_type            TEXT NOT NULL DEFAULT 'monthly',

  -- Traffic
  profile_views          INTEGER NOT NULL DEFAULT 0,
  search_appearances     INTEGER NOT NULL DEFAULT 0,
  direction_requests     INTEGER NOT NULL DEFAULT 0,
  website_clicks         INTEGER NOT NULL DEFAULT 0,
  phone_clicks           INTEGER NOT NULL DEFAULT 0,

  -- Receipts
  receipt_count          INTEGER NOT NULL DEFAULT 0,
  receipt_total          NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  unique_customers       INTEGER NOT NULL DEFAULT 0,
  returning_customers    INTEGER NOT NULL DEFAULT 0,

  -- Reviews
  new_reviews            INTEGER NOT NULL DEFAULT 0,
  avg_rating_period      NUMERIC(3,2),

  -- Jobs & events
  job_applications       INTEGER NOT NULL DEFAULT 0,
  event_rsvps            INTEGER NOT NULL DEFAULT 0,

  -- Followers
  new_followers          INTEGER NOT NULL DEFAULT 0,
  total_followers        INTEGER NOT NULL DEFAULT 0,

  -- Rewards
  rewards_redeemed       INTEGER NOT NULL DEFAULT 0,
  rewards_value          NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT business_analytics_period_valid CHECK (period_end >= period_start),
  UNIQUE (business_id, period_start, period_end, period_type)
);

CREATE INDEX idx_biz_analytics_business ON public.business_analytics(business_id);
CREATE INDEX idx_biz_analytics_period   ON public.business_analytics(period_start, period_end);

ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biz_analytics: business owner reads own"
  ON public.business_analytics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "biz_analytics: admins full access"
  ON public.business_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_biz_analytics_updated_at
  BEFORE UPDATE ON public.business_analytics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Function: compute local impact snapshot for a user and period
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_user_impact_snapshot(
  p_user_id    UUID,
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS public.local_impact_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot     public.local_impact_snapshots;
  v_spending     NUMERIC(12,2) := 0;
  v_comm_spend   NUMERIC(12,2) := 0;
  v_biz_count    INTEGER := 0;
  v_jobs_est     NUMERIC(8,2) := 0;
  v_events       INTEGER := 0;
  v_reviews      INTEGER := 0;
  v_referrals    INTEGER := 0;
  v_new_biz      INTEGER := 0;
  v_comm_biz     INTEGER := 0;
  v_vet_biz      INTEGER := 0;
  v_woman_biz    INTEGER := 0;
  v_pts_earned   INTEGER := 0;
  v_pts_redeemed INTEGER := 0;
BEGIN
  -- Approved receipts in period
  SELECT
    COALESCE(SUM(r.total), 0),
    COALESCE(SUM(CASE WHEN b.is_community_owned THEN r.total ELSE 0 END), 0),
    COUNT(DISTINCT r.business_id),
    COUNT(DISTINCT CASE WHEN b.is_community_owned THEN r.business_id END),
    COUNT(DISTINCT CASE WHEN b.is_veteran_owned   THEN r.business_id END),
    COUNT(DISTINCT CASE WHEN b.is_woman_owned     THEN r.business_id END)
  INTO v_spending, v_comm_spend, v_biz_count, v_comm_biz, v_vet_biz, v_woman_biz
  FROM public.receipts r
  LEFT JOIN public.businesses b ON b.id = r.business_id
  WHERE r.user_id = p_user_id
    AND r.status  = 'approved'
    AND r.receipt_date BETWEEN p_start_date AND p_end_date;

  -- Rough local jobs estimate: $50k annual per FTE, avg 40h/week, scaled to receipt volume
  v_jobs_est := ROUND((v_spending / 50000.0) * 12, 2);

  -- Events
  SELECT COUNT(*) INTO v_events
  FROM public.event_rsvps er
  JOIN public.events e ON e.id = er.event_id
  WHERE er.user_id  = p_user_id
    AND er.status   = 'going'
    AND er.check_in_at IS NOT NULL
    AND e.start_at  BETWEEN p_start_date::TIMESTAMPTZ AND (p_end_date + 1)::TIMESTAMPTZ;

  -- Reviews
  SELECT COUNT(*) INTO v_reviews
  FROM public.reviews
  WHERE reviewer_id = p_user_id
    AND created_at BETWEEN p_start_date::TIMESTAMPTZ AND (p_end_date + 1)::TIMESTAMPTZ
    AND status = 'published';

  -- Referrals
  SELECT COUNT(*) INTO v_referrals
  FROM public.referral_events
  WHERE referrer_id = p_user_id
    AND status      = 'completed'
    AND created_at  BETWEEN p_start_date::TIMESTAMPTZ AND (p_end_date + 1)::TIMESTAMPTZ;

  -- New businesses supported (businesses created in this period that user visited)
  SELECT COUNT(DISTINCT r.business_id) INTO v_new_biz
  FROM public.receipts r
  JOIN public.businesses b ON b.id = r.business_id
  WHERE r.user_id   = p_user_id
    AND r.status    = 'approved'
    AND r.receipt_date BETWEEN p_start_date AND p_end_date
    AND b.created_at >= (p_start_date - INTERVAL '90 days')::TIMESTAMPTZ;

  -- Points
  SELECT
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
  INTO v_pts_earned, v_pts_redeemed
  FROM public.points_transactions
  WHERE user_id   = p_user_id
    AND created_at BETWEEN p_start_date::TIMESTAMPTZ AND (p_end_date + 1)::TIMESTAMPTZ;

  -- Upsert snapshot
  INSERT INTO public.local_impact_snapshots (
    user_id, period_start, period_end,
    dollars_spent_local, dollars_spent_community,
    businesses_supported, local_jobs_supported,
    events_attended, reviews_written, referrals_made,
    new_businesses_supported, community_businesses_supported,
    veteran_businesses_supported, woman_businesses_supported,
    points_earned, points_redeemed
  ) VALUES (
    p_user_id, p_start_date, p_end_date,
    v_spending, v_comm_spend,
    v_biz_count, v_jobs_est,
    v_events, v_reviews, v_referrals,
    v_new_biz, v_comm_biz,
    v_vet_biz, v_woman_biz,
    v_pts_earned, v_pts_redeemed
  )
  ON CONFLICT (user_id, period_start, period_end) DO UPDATE SET
    dollars_spent_local            = EXCLUDED.dollars_spent_local,
    dollars_spent_community        = EXCLUDED.dollars_spent_community,
    businesses_supported           = EXCLUDED.businesses_supported,
    local_jobs_supported           = EXCLUDED.local_jobs_supported,
    events_attended                = EXCLUDED.events_attended,
    reviews_written                = EXCLUDED.reviews_written,
    referrals_made                 = EXCLUDED.referrals_made,
    new_businesses_supported       = EXCLUDED.new_businesses_supported,
    community_businesses_supported = EXCLUDED.community_businesses_supported,
    veteran_businesses_supported   = EXCLUDED.veteran_businesses_supported,
    woman_businesses_supported     = EXCLUDED.woman_businesses_supported,
    points_earned                  = EXCLUDED.points_earned,
    points_redeemed                = EXCLUDED.points_redeemed
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$;

-- ---------------------------------------------------------------------------
-- View: Platform-wide summary stats (admin-facing)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.platform_summary AS
SELECT
  (SELECT COUNT(*) FROM public.profiles)                                AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'consumer')        AS consumers,
  (SELECT COUNT(*) FROM public.businesses WHERE status = 'active')      AS active_businesses,
  (SELECT COUNT(*) FROM public.receipts WHERE status = 'approved')      AS approved_receipts,
  (SELECT COALESCE(SUM(total), 0) FROM public.receipts WHERE status = 'approved') AS total_local_spending,
  (SELECT COUNT(*) FROM public.events WHERE status = 'published')       AS published_events,
  (SELECT COUNT(*) FROM public.job_postings WHERE is_active = TRUE)     AS active_job_postings,
  (SELECT COUNT(*) FROM public.community_legends)                       AS community_legends,
  NOW() AS computed_at;
