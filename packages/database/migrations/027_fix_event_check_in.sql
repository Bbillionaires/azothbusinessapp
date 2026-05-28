-- Migration 027: Fix event_check_in function — column names start_at/end_at not starts_at/ends_at
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
  IF v_event.start_at > NOW() + INTERVAL '2 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Check-in is not yet open');
  END IF;

  IF v_event.end_at IS NOT NULL AND v_event.end_at < NOW() - INTERVAL '1 hour' THEN
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
