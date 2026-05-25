-- =============================================================================
-- Migration 003: Receipts — Receipt tracking with fraud detection
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.receipt_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'duplicate',
  'suspicious'
);

-- ---------------------------------------------------------------------------
-- receipts
-- ---------------------------------------------------------------------------
CREATE TABLE public.receipts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id      UUID REFERENCES public.businesses(id) ON DELETE SET NULL,

  -- Merchant info (may be auto-detected via OCR before business is linked)
  merchant_name    TEXT NOT NULL,

  -- Receipt details
  receipt_date     DATE NOT NULL,
  receipt_time     TIME,
  subtotal         NUMERIC(10,2),
  tax              NUMERIC(10,2),
  total            NUMERIC(10,2) NOT NULL CHECK (total > 0),
  receipt_number   TEXT,

  -- Structured line items: [{ description, quantity, unit_price, total }]
  items            JSONB NOT NULL DEFAULT '[]',

  -- Raw OCR output stored for audit/ML purposes
  ocr_data         JSONB NOT NULL DEFAULT '{}',

  -- Fingerprint for exact-duplicate detection (hash of merchant+date+total)
  receipt_hash     TEXT NOT NULL,

  -- Storage URL of the uploaded receipt image
  image_url        TEXT NOT NULL,

  -- Fraud scoring: 0.0 (clean) to 1.0 (very suspicious)
  fraud_score      NUMERIC(4,3) NOT NULL DEFAULT 0.0
                   CHECK (fraud_score BETWEEN 0.0 AND 1.0),

  -- Flags: array of strings e.g. ["duplicate_hash", "amount_outlier"]
  fraud_flags      JSONB NOT NULL DEFAULT '[]',

  -- Review workflow
  status           public.receipt_status NOT NULL DEFAULT 'pending',
  points_awarded   INTEGER CHECK (points_awarded >= 0),
  reviewed_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes     TEXT,
  reviewed_at      TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_user          ON public.receipts(user_id);
CREATE INDEX idx_receipts_business      ON public.receipts(business_id);
CREATE INDEX idx_receipts_status        ON public.receipts(status);
CREATE INDEX idx_receipts_receipt_date  ON public.receipts(receipt_date DESC);
CREATE INDEX idx_receipts_receipt_hash  ON public.receipts(receipt_hash);
CREATE INDEX idx_receipts_fraud_score   ON public.receipts(fraud_score DESC) WHERE fraud_score > 0.5;
CREATE INDEX idx_receipts_created_at    ON public.receipts(created_at DESC);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts: user can read own"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "receipts: user can insert own"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel/update pending receipts only
CREATE POLICY "receipts: user can update own pending"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts: admins full access"
  ON public.receipts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- Business owners can view receipts submitted to their business
CREATE POLICY "receipts: business owner can read"
  ON public.receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- receipt_fingerprints
-- Secondary dedup table for fuzzy-match fingerprints (perceptual hash, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE public.receipt_fingerprints (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id       UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  hash_type        TEXT NOT NULL DEFAULT 'exact',  -- 'exact' | 'phash' | 'dhash'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipt_fingerprints_receipt ON public.receipt_fingerprints(receipt_id);
CREATE INDEX idx_receipt_fingerprints_hash    ON public.receipt_fingerprints(fingerprint_hash);

ALTER TABLE public.receipt_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_fingerprints: admins only"
  ON public.receipt_fingerprints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Function: compute points for a receipt (1 point per dollar, rounded)
-- Overridden by business-specific multipliers when applicable
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_receipt_points(p_total NUMERIC)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, floor(p_total)::INTEGER);
$$;

-- ---------------------------------------------------------------------------
-- Function: check for duplicate receipt before insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_receipt_duplicate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- Exact hash match (same hash submitted by any user in last 90 days)
  SELECT id INTO v_existing_id
  FROM public.receipts
  WHERE receipt_hash = NEW.receipt_hash
    AND created_at > NOW() - INTERVAL '90 days'
    AND id != NEW.id
  LIMIT 1;

  IF FOUND THEN
    NEW.status     := 'duplicate';
    NEW.fraud_score := 1.0;
    NEW.fraud_flags := NEW.fraud_flags || '["duplicate_hash"]'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_receipt_duplicate_before_insert
  BEFORE INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.check_receipt_duplicate();
