-- ============================================================
-- Migration 017: Investor Interest Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  investor_name TEXT NOT NULL,
  investor_email TEXT NOT NULL,
  investor_phone TEXT,
  message TEXT,
  opportunity_type TEXT DEFAULT 'partnership'
    CHECK (opportunity_type IN ('partnership', 'funding', 'acquisition', 'franchise', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investor_interest_business ON investor_interest(business_id);
CREATE INDEX idx_investor_interest_status ON investor_interest(status);

ALTER TABLE investor_interest ENABLE ROW LEVEL SECURITY;

-- Business owners can see interest in their businesses
CREATE POLICY "investor_interest_owner_select" ON investor_interest
  FOR SELECT USING (auth.owns_business(business_id) OR auth.is_admin());

-- Anyone can insert (express interest — no auth required for discovery flow)
CREATE POLICY "investor_interest_insert" ON investor_interest
  FOR INSERT WITH CHECK (true);

-- Only owner/admin can update status
CREATE POLICY "investor_interest_update" ON investor_interest
  FOR UPDATE USING (auth.owns_business(business_id) OR auth.is_admin());

-- ============================================================
-- Add event check-in capability
-- ============================================================

ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS check_in_code TEXT;

-- Function to check into an event
CREATE OR REPLACE FUNCTION public.event_check_in(
  p_event_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event events;
  v_rsvp event_rsvps;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  -- Check if event is happening (within 2 hours window)
  IF v_event.starts_at > NOW() + INTERVAL '2 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Check-in is not yet open');
  END IF;

  IF v_event.ends_at IS NOT NULL AND v_event.ends_at < NOW() - INTERVAL '1 hour' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event has already ended');
  END IF;

  -- Upsert RSVP with check-in
  INSERT INTO event_rsvps (event_id, user_id, status, checked_in_at)
  VALUES (p_event_id, p_user_id, 'going', NOW())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET checked_in_at = EXCLUDED.checked_in_at, status = 'going';

  -- Award points for attending
  IF v_event.points_reward > 0 THEN
    PERFORM public.award_points(
      p_user_id, v_event.points_reward,
      'event_checkin', p_event_id,
      'Attended: ' || v_event.title
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_title', v_event.title,
    'points_awarded', v_event.points_reward
  );
END;
$$;
