-- =============================================================================
-- Migration 002: Businesses
-- Full business directory with verification, media, and social links
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.business_status AS ENUM (
  'pending',
  'active',
  'suspended',
  'closed'
);

CREATE TYPE public.verification_level AS ENUM (
  'none',
  'basic',
  'pro',
  'elite',
  'community_trusted'
);

CREATE TYPE public.verification_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'requires_more_info'
);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
CREATE TABLE public.businesses (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- Identity
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL UNIQUE,
  description               TEXT,
  family_name               TEXT,              -- e.g. "The Johnson Family"
  year_founded              SMALLINT,

  -- Media
  logo_url                  TEXT,
  cover_url                 TEXT,

  -- Contact
  phone                     TEXT,
  email                     TEXT,
  website                   TEXT,

  -- Location
  address                   TEXT,
  city                      TEXT,
  state                     TEXT,
  zip                       TEXT,
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,

  -- Classification
  category                  TEXT NOT NULL,
  subcategory               TEXT,
  tags                      TEXT[] NOT NULL DEFAULT '{}',

  -- Hours: { mon: { open: "09:00", close: "17:00", closed: false }, ... }
  hours                     JSONB NOT NULL DEFAULT '{}',

  -- Status
  status                    public.business_status NOT NULL DEFAULT 'pending',

  -- Ownership badges
  is_local_owned            BOOLEAN NOT NULL DEFAULT FALSE,
  is_community_owned        BOOLEAN NOT NULL DEFAULT FALSE,
  is_veteran_owned          BOOLEAN NOT NULL DEFAULT FALSE,
  is_nonprofit_owned        BOOLEAN NOT NULL DEFAULT FALSE,
  is_woman_owned            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Verification
  verification_level        public.verification_level NOT NULL DEFAULT 'none',

  -- Discovery flags (updated by jobs or admin)
  is_featured               BOOLEAN NOT NULL DEFAULT FALSE,
  is_top_rated              BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium                BOOLEAN NOT NULL DEFAULT FALSE,
  hiring_now                BOOLEAN NOT NULL DEFAULT FALSE,
  has_free_today            BOOLEAN NOT NULL DEFAULT FALSE,
  has_upcoming_event        BOOLEAN NOT NULL DEFAULT FALSE,
  has_investment_opportunity BOOLEAN NOT NULL DEFAULT FALSE,

  -- Referral program
  referral_percentage       NUMERIC(5,2),     -- e.g. 5.00 for 5%
  referral_fixed_amount     NUMERIC(10,2),    -- flat dollar reward

  -- Aggregates (denormalized for perf, updated via triggers/jobs)
  total_reviews             INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  average_rating            NUMERIC(3,2)      CHECK (average_rating BETWEEN 0 AND 5),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_businesses_owner        ON public.businesses(owner_id);
CREATE INDEX idx_businesses_status       ON public.businesses(status);
CREATE INDEX idx_businesses_category     ON public.businesses(category);
CREATE INDEX idx_businesses_city_state   ON public.businesses(city, state);
CREATE INDEX idx_businesses_location     ON public.businesses(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_businesses_tags         ON public.businesses USING GIN(tags);
CREATE INDEX idx_businesses_name_trgm    ON public.businesses USING GIN(name gin_trgm_ops);
CREATE INDEX idx_businesses_is_featured  ON public.businesses(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_businesses_hiring       ON public.businesses(hiring_now) WHERE hiring_now = TRUE;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses: anyone can read active"
  ON public.businesses FOR SELECT
  USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "businesses: owner can insert"
  ON public.businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses: owner can update"
  ON public.businesses FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses: admins full access"
  ON public.businesses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- business_photos
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  caption      TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  SMALLINT NOT NULL DEFAULT 0,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_photos_business ON public.business_photos(business_id);
CREATE INDEX idx_business_photos_primary  ON public.business_photos(business_id, is_primary) WHERE is_primary = TRUE;

ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_photos: public read"
  ON public.business_photos FOR SELECT USING (TRUE);

CREATE POLICY "business_photos: owner or admin write"
  ON public.business_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- business_videos
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_videos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  title          TEXT,
  thumbnail_url  TEXT,
  duration_sec   INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_videos_business ON public.business_videos(business_id);

ALTER TABLE public.business_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_videos: public read" ON public.business_videos FOR SELECT USING (TRUE);
CREATE POLICY "business_videos: owner write"
  ON public.business_videos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- business_services
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_services (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price_range  TEXT,           -- e.g. "$10–$50" or "Free"
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_services_business ON public.business_services(business_id);

ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_services: public read" ON public.business_services FOR SELECT USING (TRUE);
CREATE POLICY "business_services: owner write"
  ON public.business_services FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- business_social
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_social (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,   -- 'instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'linkedin'
  url          TEXT NOT NULL,
  handle       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, platform)
);

CREATE INDEX idx_business_social_business ON public.business_social(business_id);

ALTER TABLE public.business_social ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_social: public read" ON public.business_social FOR SELECT USING (TRUE);
CREATE POLICY "business_social: owner write"
  ON public.business_social FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- business_followers
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_followers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX idx_business_followers_business ON public.business_followers(business_id);
CREATE INDEX idx_business_followers_user     ON public.business_followers(user_id);

ALTER TABLE public.business_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_followers: authenticated read" ON public.business_followers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "business_followers: user manages own follows"
  ON public.business_followers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- business_verification_requests
-- ---------------------------------------------------------------------------
CREATE TABLE public.business_verification_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  level        public.verification_level NOT NULL,
  status       public.verification_request_status NOT NULL DEFAULT 'pending',
  documents    JSONB NOT NULL DEFAULT '[]',   -- array of { type, url, name }
  notes        TEXT,
  reviewed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bvr_business ON public.business_verification_requests(business_id);
CREATE INDEX idx_bvr_status   ON public.business_verification_requests(status);

ALTER TABLE public.business_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bvr: owner can read own requests"
  ON public.business_verification_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "bvr: owner can create"
  ON public.business_verification_requests FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "bvr: admins full access"
  ON public.business_verification_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_bvr_updated_at
  BEFORE UPDATE ON public.business_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: generate business slug from name
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_business_slug(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(
    regexp_replace(unaccent(p_name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));

  final_slug := base_slug;

  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug);
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;
