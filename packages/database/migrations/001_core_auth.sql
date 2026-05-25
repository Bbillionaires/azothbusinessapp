-- =============================================================================
-- Migration 001: Core Auth — User Profiles & Settings
-- Extends Supabase's built-in auth.users table
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";          -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions; -- geospatial (optional, enable in Supabase dashboard)

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
  'consumer',
  'business',
  'investor',
  'advertiser',
  'admin_staff',
  'admin_manager',
  'super_admin'
);

CREATE TYPE public.user_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum',
  'legend'
);

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row. Created automatically via trigger below.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  full_name            TEXT,
  avatar_url           TEXT,
  phone                TEXT,
  role                 public.user_role NOT NULL DEFAULT 'consumer',
  referral_code        TEXT UNIQUE NOT NULL,
  referred_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  points_balance       INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_points_earned  INTEGER NOT NULL DEFAULT 0 CHECK (total_points_earned >= 0),
  tier                 public.user_tier NOT NULL DEFAULT 'bronze',
  bio                  TEXT,
  city                 TEXT,
  state                TEXT,
  zip                  TEXT,
  is_public_profile    BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned            BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason           TEXT,
  last_active_at       TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_referral_code  ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by    ON public.profiles(referred_by);
CREATE INDEX idx_profiles_role           ON public.profiles(role);
CREATE INDEX idx_profiles_tier           ON public.profiles(tier);
CREATE INDEX idx_profiles_email          ON public.profiles(email);

-- Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users can read any public profile"
  ON public.profiles FOR SELECT
  USING (is_public_profile = TRUE OR auth.uid() = id);

CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: admins have full access"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_settings (
  user_id                  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notifications_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications      BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications       BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails         BOOLEAN NOT NULL DEFAULT FALSE,
  sms_notifications        BOOLEAN NOT NULL DEFAULT FALSE,
  leaderboard_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  show_spending_on_profile BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_language       TEXT NOT NULL DEFAULT 'en',
  preferred_currency       TEXT NOT NULL DEFAULT 'USD',
  dark_mode                BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings: owner access only"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings: admins read access"
  ON public.user_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Helper: generate a unique referral code
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code   TEXT := '';
  i      INTEGER;
  exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile + settings on new auth user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    public.generate_referral_code()
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: update updated_at timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Function: update user tier based on points
-- Called after points_transactions insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_tier(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_tier  public.user_tier;
BEGIN
  SELECT total_points_earned INTO v_total
  FROM public.profiles
  WHERE id = p_user_id;

  v_tier := CASE
    WHEN v_total >= 100000 THEN 'legend'
    WHEN v_total >= 25000  THEN 'platinum'
    WHEN v_total >= 10000  THEN 'gold'
    WHEN v_total >= 2500   THEN 'silver'
    ELSE                        'bronze'
  END::public.user_tier;

  UPDATE public.profiles
  SET tier = v_tier
  WHERE id = p_user_id AND tier IS DISTINCT FROM v_tier;
END;
$$;
