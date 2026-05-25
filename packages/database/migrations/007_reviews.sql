-- =============================================================================
-- Migration 007: Reviews — Weighted review system with responses and voting
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.review_status AS ENUM (
  'pending',
  'published',
  'removed'
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id                 UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Rating 1-5 with half-star precision
  rating                      NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),

  -- Content
  title                       TEXT,
  body                        TEXT NOT NULL CHECK (length(body) >= 10),
  photos                      TEXT[] NOT NULL DEFAULT '{}',
  video_url                   TEXT,

  -- Review weighting (0.5 to 3.0 based on reviewer credibility)
  weight                      NUMERIC(3,1) NOT NULL DEFAULT 1.0
                              CHECK (weight BETWEEN 0.1 AND 5.0),

  -- Special reviewer flags
  is_community_legend_review  BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified_purchase        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Linked receipt for verified purchase
  receipt_id                  UUID REFERENCES public.receipts(id) ON DELETE SET NULL,

  -- Moderation
  is_flagged                  BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason                 TEXT,
  status                      public.review_status NOT NULL DEFAULT 'pending',
  moderated_by                UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Engagement counters (denormalized)
  helpful_count               INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count           INTEGER NOT NULL DEFAULT 0 CHECK (not_helpful_count >= 0),

  -- Source
  source                      TEXT NOT NULL DEFAULT 'app',  -- 'app' | 'imported'

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (business_id, reviewer_id)  -- one review per user per business
);

-- Indexes
CREATE INDEX idx_reviews_business    ON public.reviews(business_id);
CREATE INDEX idx_reviews_reviewer    ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_status      ON public.reviews(status);
CREATE INDEX idx_reviews_rating      ON public.reviews(business_id, rating);
CREATE INDEX idx_reviews_created     ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_flagged     ON public.reviews(is_flagged) WHERE is_flagged = TRUE;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: anyone can read published"
  ON public.reviews FOR SELECT
  USING (status = 'published' OR reviewer_id = auth.uid());

CREATE POLICY "reviews: authenticated user can insert"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() IS NOT NULL);

CREATE POLICY "reviews: reviewer can update own pending"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id AND status = 'pending')
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews: reviewer can delete own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id AND status IN ('pending', 'published'));

CREATE POLICY "reviews: admins full access"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: update business aggregate rating when review changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
  v_avg         NUMERIC(3,2);
  v_count       INTEGER;
BEGIN
  v_business_id := COALESCE(NEW.business_id, OLD.business_id);

  SELECT
    ROUND(SUM(rating * weight) / NULLIF(SUM(weight), 0), 2),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE business_id = v_business_id AND status = 'published';

  UPDATE public.businesses
  SET average_rating = v_avg,
      total_reviews  = COALESCE(v_count, 0)
  WHERE id = v_business_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

-- ---------------------------------------------------------------------------
-- review_responses
-- Business owner replies to a review
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_responses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id   UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (length(body) >= 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id)  -- one response per review
);

CREATE INDEX idx_review_responses_review   ON public.review_responses(review_id);
CREATE INDEX idx_review_responses_business ON public.review_responses(business_id);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_responses: anyone reads"
  ON public.review_responses FOR SELECT USING (TRUE);

CREATE POLICY "review_responses: business owner writes"
  ON public.review_responses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "review_responses: admins full access"
  ON public.review_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_review_responses_updated_at
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- review_helpful
-- "Was this review helpful?" votes
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_helpful (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id   UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_helpful_review ON public.review_helpful(review_id);
CREATE INDEX idx_review_helpful_user   ON public.review_helpful(user_id);

ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_helpful: authenticated reads"
  ON public.review_helpful FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "review_helpful: user manages own votes"
  ON public.review_helpful FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update helpful_count / not_helpful_count on review
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.reviews
  SET
    helpful_count     = (SELECT COUNT(*) FROM public.review_helpful WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = TRUE),
    not_helpful_count = (SELECT COUNT(*) FROM public.review_helpful WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = FALSE)
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_helpful_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.review_helpful
  FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

-- ---------------------------------------------------------------------------
-- Function: set review weight based on reviewer tier and badges
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_review_weight(p_reviewer_id UUID)
RETURNS NUMERIC(3,1)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tier          public.user_tier;
  v_is_legend     BOOLEAN;
  v_weight        NUMERIC(3,1) := 1.0;
BEGIN
  SELECT tier INTO v_tier FROM public.profiles WHERE id = p_reviewer_id;

  v_is_legend := EXISTS (
    SELECT 1 FROM public.community_legends
    WHERE user_id = p_reviewer_id AND tier IN ('gold', 'platinum', 'legend', 'hall_of_legends')
  );

  v_weight := CASE v_tier
    WHEN 'legend'   THEN 3.0
    WHEN 'platinum' THEN 2.5
    WHEN 'gold'     THEN 2.0
    WHEN 'silver'   THEN 1.5
    ELSE                 1.0
  END;

  IF v_is_legend THEN
    v_weight := LEAST(5.0, v_weight + 0.5);
  END IF;

  RETURN v_weight;
END;
$$;
