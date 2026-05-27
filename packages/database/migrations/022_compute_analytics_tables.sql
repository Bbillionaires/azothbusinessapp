-- Add active_offers_count to businesses for quick denormalized count
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS active_offers_count INTEGER NOT NULL DEFAULT 0;

-- Add business_id + status to offer_redemptions for analytics
ALTER TABLE public.offer_redemptions
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_offer_redemptions_business ON public.offer_redemptions(business_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_status ON public.offer_redemptions(status);

-- Offer analytics summary per business per period
CREATE TABLE IF NOT EXISTS public.offer_analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  offer_redemptions INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_offer_analytics_business ON public.offer_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_offer_analytics_period ON public.offer_analytics(period_start);

ALTER TABLE public.offer_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_analytics_owner" ON public.offer_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR auth.is_admin()
  );
