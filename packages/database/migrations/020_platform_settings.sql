-- Platform configuration settings (super_admin editable)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Default values
INSERT INTO public.platform_settings (key, value) VALUES
  ('points_per_dollar',           '1'),
  ('receipt_daily_cap',           '500'),
  ('review_points',               '10'),
  ('event_points',                '25'),
  ('referral_user_points',        '100'),
  ('referral_business_points',    '500'),
  ('tier_bronze_min',             '0'),
  ('tier_silver_min',             '1000'),
  ('tier_gold_min',               '5000'),
  ('tier_platinum_min',           '20000'),
  ('tier_legend_min',             '100000'),
  ('price_basic',                 '9.99'),
  ('price_pro',                   '29.99'),
  ('price_elite',                 '79.99'),
  ('fraud_auto_reject_score',     '90'),
  ('fraud_review_score',          '30'),
  ('fraud_daily_receipt_cap',     '10'),
  ('fraud_max_amount',            '500'),
  ('age_new_max',                 '3'),
  ('age_established_min',         '3'),
  ('age_legacy_min',              '10'),
  ('age_historic_min',            '25'),
  ('age_landmark_min',            '50')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read/write
CREATE POLICY "super_admin_full_access" ON public.platform_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
