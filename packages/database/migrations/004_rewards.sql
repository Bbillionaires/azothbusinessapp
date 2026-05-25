-- =============================================================================
-- Migration 004: Rewards — Points catalog, redemptions, and transactions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.reward_type AS ENUM (
  'discount',
  'gift_card',
  'coupon',
  'event_ticket',
  'promotion',
  'community'
);

CREATE TYPE public.redemption_status AS ENUM (
  'pending',
  'completed',
  'expired',
  'cancelled'
);

CREATE TYPE public.transaction_type AS ENUM (
  'earned',
  'spent',
  'bonus',
  'referral',
  'adjustment'
);

-- ---------------------------------------------------------------------------
-- reward_catalog
-- Rewards offered system-wide or by specific businesses
-- ---------------------------------------------------------------------------
CREATE TABLE public.reward_catalog (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT NOT NULL,
  description        TEXT,
  type               public.reward_type NOT NULL,

  -- Cost to redeem (in points)
  points_cost        INTEGER NOT NULL CHECK (points_cost > 0),

  -- Dollar or intrinsic value
  value              NUMERIC(10,2),

  -- NULL = system-wide reward; set for business-specific rewards
  business_id        UUID REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Inventory
  quantity_available INTEGER,  -- NULL = unlimited
  quantity_redeemed  INTEGER NOT NULL DEFAULT 0 CHECK (quantity_redeemed >= 0),

  -- Availability window
  starts_at          TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,

  -- Eligibility constraints
  min_tier           public.user_tier,   -- NULL = any tier
  image_url          TEXT,

  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_catalog_business  ON public.reward_catalog(business_id);
CREATE INDEX idx_reward_catalog_type      ON public.reward_catalog(type);
CREATE INDEX idx_reward_catalog_active    ON public.reward_catalog(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_reward_catalog_expires   ON public.reward_catalog(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_catalog: anyone can read active"
  ON public.reward_catalog FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "reward_catalog: business owner manages own rewards"
  ON public.reward_catalog FOR ALL
  USING (
    business_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "reward_catalog: admins full access"
  ON public.reward_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_reward_catalog_updated_at
  BEFORE UPDATE ON public.reward_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reward_redemptions
-- ---------------------------------------------------------------------------
CREATE TABLE public.reward_redemptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id    UUID NOT NULL REFERENCES public.reward_catalog(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status       public.redemption_status NOT NULL DEFAULT 'pending',
  code         TEXT,          -- generated coupon / redemption code
  redeemed_at  TIMESTAMPTZ,   -- when the consumer actually used it at the business
  expires_at   TIMESTAMPTZ,   -- code expiry (if applicable)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user   ON public.reward_redemptions(user_id);
CREATE INDEX idx_redemptions_reward ON public.reward_redemptions(reward_id);
CREATE INDEX idx_redemptions_status ON public.reward_redemptions(status);
CREATE INDEX idx_redemptions_code   ON public.reward_redemptions(code) WHERE code IS NOT NULL;

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redemptions: user reads own"
  ON public.reward_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "redemptions: user creates own"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "redemptions: admins full access"
  ON public.reward_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- Business owners can view redemptions for their rewards
CREATE POLICY "redemptions: business owner reads"
  ON public.reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reward_catalog rc
      JOIN public.businesses b ON b.id = rc.business_id
      WHERE rc.id = reward_id AND b.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_redemptions_updated_at
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- points_transactions
-- Immutable ledger — no updates or deletes
-- ---------------------------------------------------------------------------
CREATE TABLE public.points_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount           INTEGER NOT NULL,  -- positive = credit, negative = debit
  type             public.transaction_type NOT NULL,

  -- Polymorphic reference
  reference_id     UUID,    -- ID of the receipt, redemption, referral, etc.
  reference_type   TEXT,    -- 'receipt' | 'redemption' | 'referral' | 'bonus' | 'admin'

  description      TEXT NOT NULL,
  balance_after    INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_tx_user      ON public.points_transactions(user_id);
CREATE INDEX idx_points_tx_type      ON public.points_transactions(type);
CREATE INDEX idx_points_tx_ref       ON public.points_transactions(reference_id, reference_type)
  WHERE reference_id IS NOT NULL;
CREATE INDEX idx_points_tx_created   ON public.points_transactions(created_at DESC);

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_tx: user reads own"
  ON public.points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No updates or deletes on the ledger
CREATE POLICY "points_tx: system inserts only"
  ON public.points_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE POLICY "points_tx: admins read all"
  ON public.points_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Function: award points and update profile balance atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id        UUID,
  p_amount         INTEGER,
  p_type           public.transaction_type,
  p_description    TEXT,
  p_reference_id   UUID    DEFAULT NULL,
  p_reference_type TEXT    DEFAULT NULL
)
RETURNS public.points_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance  INTEGER;
  v_transaction  public.points_transactions;
BEGIN
  -- Update the profile balance
  UPDATE public.profiles
  SET
    points_balance      = points_balance + p_amount,
    total_points_earned = CASE WHEN p_amount > 0
                            THEN total_points_earned + p_amount
                            ELSE total_points_earned
                          END
  WHERE id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- Record the transaction
  INSERT INTO public.points_transactions (
    user_id, amount, type, reference_id, reference_type, description, balance_after
  ) VALUES (
    p_user_id, p_amount, p_type, p_reference_id, p_reference_type, p_description, v_new_balance
  )
  RETURNING * INTO v_transaction;

  -- Recalculate tier
  PERFORM public.update_user_tier(p_user_id);

  RETURN v_transaction;
END;
$$;

-- ---------------------------------------------------------------------------
-- Function: redeem a reward atomically (deduct points + create redemption)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id   UUID,
  p_reward_id UUID
)
RETURNS public.reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward     public.reward_catalog;
  v_redemption public.reward_redemptions;
  v_balance    INTEGER;
  v_code       TEXT;
BEGIN
  -- Lock the reward row
  SELECT * INTO v_reward FROM public.reward_catalog WHERE id = p_reward_id FOR UPDATE;

  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'Reward not available';
  END IF;

  IF v_reward.expires_at IS NOT NULL AND v_reward.expires_at < NOW() THEN
    RAISE EXCEPTION 'Reward has expired';
  END IF;

  IF v_reward.quantity_available IS NOT NULL
    AND v_reward.quantity_redeemed >= v_reward.quantity_available THEN
    RAISE EXCEPTION 'Reward is sold out';
  END IF;

  -- Check user balance
  SELECT points_balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance < v_reward.points_cost THEN
    RAISE EXCEPTION 'Insufficient points: need %, have %', v_reward.points_cost, v_balance;
  END IF;

  -- Generate redemption code
  v_code := upper(encode(gen_random_bytes(6), 'hex'));

  -- Create redemption record
  INSERT INTO public.reward_redemptions (user_id, reward_id, points_spent, code, expires_at)
  VALUES (p_user_id, p_reward_id, v_reward.points_cost, v_code,
          NOW() + INTERVAL '30 days')
  RETURNING * INTO v_redemption;

  -- Deduct points
  PERFORM public.award_points(
    p_user_id,
    -v_reward.points_cost,
    'spent',
    'Reward: ' || v_reward.name,
    v_redemption.id,
    'redemption'
  );

  -- Increment quantity used
  UPDATE public.reward_catalog
  SET quantity_redeemed = quantity_redeemed + 1
  WHERE id = p_reward_id;

  RETURN v_redemption;
END;
$$;
