-- =============================================================================
-- Migration 009: Advertising — Campaign management and impression tracking
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.ad_type AS ENUM (
  'sponsored_listing',
  'banner',
  'push_notification'
);

CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'rejected'
);

CREATE TYPE public.ad_impression_type AS ENUM (
  'view',
  'search_result',
  'featured',
  'push'
);

-- ---------------------------------------------------------------------------
-- ad_campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE public.ad_campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id      UUID REFERENCES public.businesses(id) ON DELETE SET NULL,

  name             TEXT NOT NULL,
  type             public.ad_type NOT NULL,

  -- Creative
  headline         TEXT,
  body             TEXT,
  image_url        TEXT,
  cta_text         TEXT,           -- "Shop Now", "Learn More", etc.
  cta_url          TEXT,

  -- Budget (in USD)
  budget           NUMERIC(12,2) NOT NULL CHECK (budget > 0),
  spent            NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (spent >= 0),
  daily_budget     NUMERIC(10,2),
  bid_amount       NUMERIC(8,4),   -- CPM or CPC bid in dollars

  -- Schedule
  start_at         TIMESTAMPTZ NOT NULL,
  end_at           TIMESTAMPTZ,

  -- Targeting
  target_city      TEXT,
  target_state     TEXT,
  target_category  TEXT,
  target_tags      TEXT[] NOT NULL DEFAULT '{}',
  target_tiers     public.user_tier[] NOT NULL DEFAULT '{}',  -- empty = all tiers

  -- Performance counters (denormalized)
  impressions      BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks           BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions      BIGINT NOT NULL DEFAULT 0 CHECK (conversions >= 0),

  -- Admin review
  status           public.campaign_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  reviewed_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campaign_end_after_start CHECK (end_at IS NULL OR end_at > start_at),
  CONSTRAINT campaign_within_budget CHECK (spent <= budget)
);

-- Indexes
CREATE INDEX idx_campaigns_advertiser ON public.ad_campaigns(advertiser_id);
CREATE INDEX idx_campaigns_business   ON public.ad_campaigns(business_id);
CREATE INDEX idx_campaigns_status     ON public.ad_campaigns(status);
CREATE INDEX idx_campaigns_type       ON public.ad_campaigns(type);
CREATE INDEX idx_campaigns_active     ON public.ad_campaigns(status, start_at, end_at)
  WHERE status = 'active';
CREATE INDEX idx_campaigns_target_tags ON public.ad_campaigns USING GIN(target_tags);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: advertiser reads own"
  ON public.ad_campaigns FOR SELECT
  USING (auth.uid() = advertiser_id);

CREATE POLICY "campaigns: advertiser inserts own"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "campaigns: advertiser updates draft/paused"
  ON public.ad_campaigns FOR UPDATE
  USING (auth.uid() = advertiser_id AND status IN ('draft', 'paused'))
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "campaigns: admins full access"
  ON public.ad_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ad_impressions
-- High-volume table — partitioned by month in production
-- ---------------------------------------------------------------------------
CREATE TABLE public.ad_impressions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        public.ad_impression_type NOT NULL DEFAULT 'view',
  session_id  TEXT,
  ip_hash     TEXT,  -- hashed for privacy, used for dedup
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create initial partitions (monthly)
CREATE TABLE public.ad_impressions_2025_q1 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE public.ad_impressions_2025_q2 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE public.ad_impressions_2025_q3 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

CREATE TABLE public.ad_impressions_2025_q4 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

CREATE TABLE public.ad_impressions_2026_q1 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE public.ad_impressions_2026_q2 PARTITION OF public.ad_impressions
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_impressions_campaign  ON public.ad_impressions(campaign_id);
CREATE INDEX idx_impressions_user      ON public.ad_impressions(user_id);
CREATE INDEX idx_impressions_created   ON public.ad_impressions(created_at DESC);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "impressions: admins only"
  ON public.ad_impressions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- Advertisers can read their own campaign impressions
CREATE POLICY "impressions: advertiser reads own"
  ON public.ad_impressions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = campaign_id AND c.advertiser_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ad_clicks
-- ---------------------------------------------------------------------------
CREATE TABLE public.ad_clicks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash     TEXT,
  referrer    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE public.ad_clicks_2025_q1 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE public.ad_clicks_2025_q2 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE public.ad_clicks_2025_q3 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

CREATE TABLE public.ad_clicks_2025_q4 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

CREATE TABLE public.ad_clicks_2026_q1 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE public.ad_clicks_2026_q2 PARTITION OF public.ad_clicks
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_clicks_campaign ON public.ad_clicks(campaign_id);
CREATE INDEX idx_clicks_user     ON public.ad_clicks(user_id);
CREATE INDEX idx_clicks_created  ON public.ad_clicks(created_at DESC);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clicks: admins only"
  ON public.ad_clicks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE POLICY "clicks: advertiser reads own"
  ON public.ad_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = campaign_id AND c.advertiser_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Trigger: update campaign impression/click counters and spending
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_campaign_impressions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_campaigns
  SET impressions = impressions + 1
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_campaign_clicks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_campaigns
  SET clicks = clicks + 1
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_impression
  AFTER INSERT ON public.ad_impressions
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_impressions();

CREATE TRIGGER track_click
  AFTER INSERT ON public.ad_clicks
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_clicks();

-- ---------------------------------------------------------------------------
-- View: campaign performance summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.campaign_performance AS
SELECT
  c.id,
  c.advertiser_id,
  c.name,
  c.type,
  c.status,
  c.budget,
  c.spent,
  c.impressions,
  c.clicks,
  c.conversions,
  CASE WHEN c.impressions > 0 THEN ROUND((c.clicks::NUMERIC / c.impressions) * 100, 2) ELSE 0 END AS ctr_pct,
  CASE WHEN c.clicks > 0 THEN ROUND(c.spent / c.clicks, 4) ELSE NULL END AS cost_per_click,
  c.start_at,
  c.end_at
FROM public.ad_campaigns c;
