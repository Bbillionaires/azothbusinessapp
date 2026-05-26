-- Migration 014: FCM token and misc improvements

-- Add FCM token to user_settings for push notifications
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notification_types JSONB DEFAULT '{"new_review": true, "new_follower": true, "receipt_processed": true, "reward_earned": true, "event_rsvp": true, "referral_converted": true}'::jsonb;

-- Add status column to profiles if not exists (for suspension)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'));

-- Add rejection_reason to receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add featured column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Index for featured businesses
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;

-- Index for fcm_token lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_fcm ON user_settings(user_id) WHERE fcm_token IS NOT NULL;
