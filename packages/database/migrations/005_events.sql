-- =============================================================================
-- Migration 005: Events — Community events system with RSVPs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.event_type AS ENUM (
  'vendor_market',
  'art_walk',
  'food_truck',
  'community',
  'grand_opening',
  'networking',
  'workshop',
  'fundraiser',
  'other'
);

CREATE TYPE public.event_status AS ENUM (
  'draft',
  'published',
  'cancelled',
  'completed'
);

CREATE TYPE public.rsvp_status AS ENUM (
  'going',
  'interested',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id        UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  organizer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Details
  title              TEXT NOT NULL,
  description        TEXT,
  type               public.event_type NOT NULL DEFAULT 'community',
  tags               TEXT[] NOT NULL DEFAULT '{}',

  -- Timing
  start_at           TIMESTAMPTZ NOT NULL,
  end_at             TIMESTAMPTZ,
  timezone           TEXT NOT NULL DEFAULT 'America/Chicago',
  is_recurring       BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule    TEXT,  -- iCal RRULE string

  -- Location
  venue_name         TEXT,
  address            TEXT,
  city               TEXT,
  state              TEXT,
  zip                TEXT,
  latitude           DOUBLE PRECISION,
  longitude          DOUBLE PRECISION,
  is_online          BOOLEAN NOT NULL DEFAULT FALSE,
  online_url         TEXT,

  -- Media
  image_url          TEXT,
  gallery_urls       TEXT[] NOT NULL DEFAULT '{}',

  -- Capacity
  max_attendees      INTEGER CHECK (max_attendees > 0),
  current_attendees  INTEGER NOT NULL DEFAULT 0 CHECK (current_attendees >= 0),

  -- Pricing & incentives
  is_free            BOOLEAN NOT NULL DEFAULT TRUE,
  price              NUMERIC(10,2) CHECK (price >= 0),
  points_reward      INTEGER NOT NULL DEFAULT 0 CHECK (points_reward >= 0),

  -- Status
  status             public.event_status NOT NULL DEFAULT 'draft',

  -- Moderation
  is_featured        BOOLEAN NOT NULL DEFAULT FALSE,
  flagged            BOOLEAN NOT NULL DEFAULT FALSE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT event_end_after_start CHECK (end_at IS NULL OR end_at > start_at)
);

-- Indexes
CREATE INDEX idx_events_organizer    ON public.events(organizer_id);
CREATE INDEX idx_events_business     ON public.events(business_id);
CREATE INDEX idx_events_status       ON public.events(status);
CREATE INDEX idx_events_type         ON public.events(type);
CREATE INDEX idx_events_start_at     ON public.events(start_at);
CREATE INDEX idx_events_city_state   ON public.events(city, state);
CREATE INDEX idx_events_location     ON public.events(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_events_tags         ON public.events USING GIN(tags);
CREATE INDEX idx_events_featured     ON public.events(is_featured) WHERE is_featured = TRUE;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: anyone can read published"
  ON public.events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "events: organizer can insert"
  ON public.events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "events: organizer can update own"
  ON public.events FOR UPDATE
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "events: organizer can delete draft"
  ON public.events FOR DELETE
  USING (organizer_id = auth.uid() AND status = 'draft');

CREATE POLICY "events: admins full access"
  ON public.events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_rsvps
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_rsvps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      public.rsvp_status NOT NULL DEFAULT 'going',
  check_in_at TIMESTAMPTZ,   -- set when user physically checks in at event
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_rsvps_event   ON public.event_rsvps(event_id);
CREATE INDEX idx_rsvps_user    ON public.event_rsvps(user_id);
CREATE INDEX idx_rsvps_status  ON public.event_rsvps(status);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvps: authenticated can read"
  ON public.event_rsvps FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "rsvps: user manages own"
  ON public.event_rsvps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rsvps: event organizer can read"
  ON public.event_rsvps FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

CREATE POLICY "rsvps: admins full access"
  ON public.event_rsvps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: maintain current_attendees count on events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    UPDATE public.events
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.event_id;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'going' AND NEW.status = 'going' THEN
      UPDATE public.events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    ELSIF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE public.events SET current_attendees = GREATEST(0, current_attendees - 1) WHERE id = NEW.event_id;
    END IF;

  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE public.events
    SET current_attendees = GREATEST(0, current_attendees - 1)
    WHERE id = OLD.event_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_event_attendees
  AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_event_attendee_count();

-- ---------------------------------------------------------------------------
-- Function: check in user at event and award points
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.event_check_in(p_event_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Record check-in
  UPDATE public.event_rsvps
  SET check_in_at = NOW(), status = 'going'
  WHERE event_id = p_event_id AND user_id = p_user_id AND check_in_at IS NULL;

  -- Award points if configured
  IF v_event.points_reward > 0 THEN
    PERFORM public.award_points(
      p_user_id,
      v_event.points_reward,
      'bonus',
      'Event attendance: ' || v_event.title,
      p_event_id,
      'event'
    );
  END IF;
END;
$$;
