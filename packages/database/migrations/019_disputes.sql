-- Migration 019: Disputes — user disputes for receipts, reviews, and general issues

CREATE TYPE public.dispute_type AS ENUM (
  'receipt', 'review', 'fraud', 'points', 'account', 'other'
);

CREATE TYPE public.dispute_status AS ENUM (
  'open', 'investigating', 'resolved', 'closed'
);

CREATE TYPE public.dispute_priority AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type            public.dispute_type NOT NULL DEFAULT 'other',
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          public.dispute_status NOT NULL DEFAULT 'open',
  priority        public.dispute_priority NOT NULL DEFAULT 'medium',
  receipt_id      UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  review_id       UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
  business_id     UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disputes_user_id_idx   ON disputes(user_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx    ON disputes(status);
CREATE INDEX IF NOT EXISTS disputes_priority_idx  ON disputes(priority);
CREATE INDEX IF NOT EXISTS disputes_created_at_idx ON disputes(created_at DESC);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own disputes
CREATE POLICY "disputes_user_select" ON disputes
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('admin_staff', 'admin_manager', 'super_admin'));

CREATE POLICY "disputes_user_insert" ON disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update disputes
CREATE POLICY "disputes_admin_update" ON disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin_staff', 'admin_manager', 'super_admin'))
  );
