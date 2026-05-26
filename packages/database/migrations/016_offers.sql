-- ============================================================
-- Migration 016: Business Offers / Deals
-- ============================================================

CREATE TABLE IF NOT EXISTS business_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  offer_type TEXT NOT NULL DEFAULT 'discount'
    CHECK (offer_type IN ('discount', 'bogo', 'freebie', 'event_special', 'loyalty', 'first_visit', 'flash')),
  discount_percent NUMERIC(5,2) CHECK (discount_percent BETWEEN 0 AND 100),
  discount_amount NUMERIC(10,2) CHECK (discount_amount >= 0),
  promo_code TEXT,
  terms TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_redemptions INT,
  current_redemptions INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  points_bonus INT DEFAULT 0,  -- extra points awarded when redeemed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_business ON business_offers(business_id);
CREATE INDEX idx_offers_active ON business_offers(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_offers_featured ON business_offers(is_featured) WHERE is_featured = true;

-- Auto-update updated_at
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON business_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE business_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active, non-expired offers
CREATE POLICY "offers_public_select" ON business_offers
  FOR SELECT USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
    OR auth.owns_business(business_id)
    OR auth.is_admin()
  );

CREATE POLICY "offers_owner_insert" ON business_offers
  FOR INSERT WITH CHECK (auth.owns_business(business_id));

CREATE POLICY "offers_owner_update" ON business_offers
  FOR UPDATE USING (auth.owns_business(business_id) OR auth.is_admin());

CREATE POLICY "offers_owner_delete" ON business_offers
  FOR DELETE USING (auth.owns_business(business_id) OR auth.is_admin());

-- ============================================================
-- Offer redemptions (track who used which offer)
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES business_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_id UUID REFERENCES receipts(id),
  UNIQUE(offer_id, user_id)  -- one redemption per user per offer
);

CREATE INDEX idx_offer_redemptions_offer ON offer_redemptions(offer_id);
CREATE INDEX idx_offer_redemptions_user ON offer_redemptions(user_id);

ALTER TABLE offer_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_redemptions_own" ON offer_redemptions
  FOR ALL USING (user_id = auth.uid() OR auth.is_admin());

-- Function to redeem an offer (atomic check + insert)
CREATE OR REPLACE FUNCTION public.redeem_offer(
  p_offer_id UUID,
  p_user_id UUID,
  p_receipt_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offer business_offers;
  v_redemption offer_redemptions;
BEGIN
  SELECT * INTO v_offer FROM business_offers WHERE id = p_offer_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
  END IF;

  IF NOT v_offer.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer is no longer active');
  END IF;

  IF v_offer.expires_at IS NOT NULL AND v_offer.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer has expired');
  END IF;

  IF v_offer.max_redemptions IS NOT NULL AND v_offer.current_redemptions >= v_offer.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer redemption limit reached');
  END IF;

  -- Check already redeemed
  IF EXISTS (SELECT 1 FROM offer_redemptions WHERE offer_id = p_offer_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already redeemed this offer');
  END IF;

  -- Insert redemption
  INSERT INTO offer_redemptions (offer_id, user_id, receipt_id)
  VALUES (p_offer_id, p_user_id, p_receipt_id);

  -- Increment counter
  UPDATE business_offers SET current_redemptions = current_redemptions + 1 WHERE id = p_offer_id;

  -- Award bonus points if applicable
  IF v_offer.points_bonus > 0 THEN
    PERFORM public.award_points(
      p_user_id,
      v_offer.points_bonus,
      'offer_bonus',
      p_offer_id,
      'Bonus points for redeeming offer: ' || v_offer.title
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'offer_title', v_offer.title, 'points_bonus', v_offer.points_bonus);
END;
$$;
