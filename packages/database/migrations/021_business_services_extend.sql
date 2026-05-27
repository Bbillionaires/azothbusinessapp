-- Extend business_services with numeric price and duration fields
ALTER TABLE public.business_services
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add JSONB notification_prefs to user_settings for portal use
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB;

-- Add fcm_token directly on user_settings (avoids separate lookup)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;
