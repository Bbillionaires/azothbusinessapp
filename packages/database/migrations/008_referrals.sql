-- =============================================================================
-- Migration 008: Referrals — Referral system and marketplace
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.referral_event_type AS ENUM (
  'user_signup',
  'business_signup',
  'premium_purchase',
  'greenwood_purchase',
  'sale'
);

CREATE TYPE public.referral_event_status AS ENUM (
  'pending',
  'completed',
  'expired'
);

CREATE TYPE public.marketplace_type AS ENUM (
  'pay_per_lead',
  'pay_per_appointment',
  'pay_per_sale',
  'affiliate',
  'commission'
);

CREATE TYPE public.marketplace_rate_type AS ENUM (
  'percentage',
  'fixed'
);

CREATE TYPE public.marketplace_app_status AS ENUM (
  'applied',
  'approved',
  'rejected',
  'paused'
);

-- ---------------------------------------------------------------------------
-- referral_links
-- User-level referral tracking
-- ---------------------------------------------------------------------------
CREATE TABLE public.referral_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  code        TEXT NOT NULL UNIQUE,
  clicks      INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  earnings    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (earnings >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_links_user ON public.referral_links(user_id);
CREATE INDEX idx_referral_links_code ON public.referral_links(code);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_links: owner reads own"
  ON public.referral_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "referral_links: admins full access"
  ON public.referral_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_referral_links_updated_at
  BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- referral_events
-- Individual referral conversion events
-- ---------------------------------------------------------------------------
CREATE TABLE public.referral_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           public.referral_event_type NOT NULL,
  amount         NUMERIC(10,2),           -- dollar amount of the triggering transaction
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  cash_awarded   NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cash_awarded >= 0),
  status         public.referral_event_status NOT NULL DEFAULT 'pending',
  metadata       JSONB NOT NULL DEFAULT '{}',
  expires_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX idx_referral_events_referred ON public.referral_events(referred_id);
CREATE INDEX idx_referral_events_type     ON public.referral_events(type);
CREATE INDEX idx_referral_events_status   ON public.referral_events(status);
CREATE INDEX idx_referral_events_created  ON public.referral_events(created_at DESC);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_events: referrer reads own"
  ON public.referral_events FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "referral_events: admins full access"
  ON public.referral_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- referral_marketplace
-- Businesses post referral/affiliate opportunities for the community
-- ---------------------------------------------------------------------------
CREATE TABLE public.referral_marketplace (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  type         public.marketplace_type NOT NULL,
  rate         NUMERIC(10,2) NOT NULL CHECK (rate > 0),
  rate_type    public.marketplace_rate_type NOT NULL,
  max_budget   NUMERIC(12,2) CHECK (max_budget > 0),
  spent        NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (spent >= 0),
  requirements TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rm_business  ON public.referral_marketplace(business_id);
CREATE INDEX idx_rm_active    ON public.referral_marketplace(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_rm_type      ON public.referral_marketplace(type);

ALTER TABLE public.referral_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rm: anyone can read active"
  ON public.referral_marketplace FOR SELECT
  USING (is_active = TRUE OR
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "rm: business owner manages"
  ON public.referral_marketplace FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "rm: admins full access"
  ON public.referral_marketplace FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_rm_updated_at
  BEFORE UPDATE ON public.referral_marketplace
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- referral_applications
-- Users applying to promote a business via the referral marketplace
-- ---------------------------------------------------------------------------
CREATE TABLE public.referral_applications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_id UUID NOT NULL REFERENCES public.referral_marketplace(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pitch          TEXT,
  status         public.marketplace_app_status NOT NULL DEFAULT 'applied',
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (marketplace_id, user_id)
);

CREATE INDEX idx_ra_marketplace ON public.referral_applications(marketplace_id);
CREATE INDEX idx_ra_user        ON public.referral_applications(user_id);
CREATE INDEX idx_ra_status      ON public.referral_applications(status);

ALTER TABLE public.referral_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ra: user reads own"
  ON public.referral_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ra: user inserts own"
  ON public.referral_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ra: business owner reads applicants"
  ON public.referral_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.referral_marketplace rm
      JOIN public.businesses b ON b.id = rm.business_id
      WHERE rm.id = marketplace_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "ra: business owner updates status"
  ON public.referral_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.referral_marketplace rm
      JOIN public.businesses b ON b.id = rm.business_id
      WHERE rm.id = marketplace_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "ra: admins full access"
  ON public.referral_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_ra_updated_at
  BEFORE UPDATE ON public.referral_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Function: process a referral event (award points, update link stats)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referrer_id UUID,
  p_referred_id UUID,
  p_type        public.referral_event_type,
  p_amount      NUMERIC DEFAULT NULL
)
RETURNS public.referral_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points        INTEGER;
  v_cash          NUMERIC(10,2) := 0.00;
  v_referral_event public.referral_events;
BEGIN
  -- Points by event type
  v_points := CASE p_type
    WHEN 'user_signup'        THEN 500
    WHEN 'business_signup'    THEN 1000
    WHEN 'premium_purchase'   THEN 750
    WHEN 'greenwood_purchase' THEN 250
    WHEN 'sale'               THEN COALESCE(floor(p_amount * 0.01)::INTEGER, 100)
    ELSE                           100
  END;

  -- Record the referral event
  INSERT INTO public.referral_events (
    referrer_id, referred_id, type, amount, points_awarded, cash_awarded, status
  ) VALUES (
    p_referrer_id, p_referred_id, p_type, p_amount, v_points, v_cash, 'completed'
  )
  RETURNING * INTO v_referral_event;

  -- Award points to referrer
  PERFORM public.award_points(
    p_referrer_id,
    v_points,
    'referral',
    'Referral: ' || p_type::TEXT,
    v_referral_event.id,
    'referral_event'
  );

  -- Update referral link stats
  UPDATE public.referral_links
  SET
    conversions = conversions + 1,
    earnings    = earnings + v_cash
  WHERE user_id = p_referrer_id;

  RETURN v_referral_event;
END;
$$;
