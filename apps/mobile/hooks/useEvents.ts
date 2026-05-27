// =============================================================================
// useEvents — community events fetched from Supabase
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventFilters {
  city?: string;
  business_id?: string;
  event_type?: string;
  from_date?: string;
  limit_n?: number;
  offset_n?: number;
}

export interface EventRow {
  id: string;
  business_id: string | null;
  title: string;
  description: string | null;
  type: string;
  image_url: string | null;
  start_at: string;
  end_at: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_free: boolean;
  price: number | null;
  max_attendees: number | null;
  current_attendees: number;
  points_reward: number;
  status: 'published' | 'draft' | 'cancelled' | 'completed';
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    logo_url: string | null;
    category: string | null;
  } | null;
}

export interface EventDetail extends EventRow {
  updated_at: string;
  external_url: string | null;
  recurrence_rule: string | null;
}

// ---------------------------------------------------------------------------
// useEvents — paginated list of published events
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20;

export function useEvents(filters: EventFilters = {}) {
  const [data, setData]       = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset]   = useState(0);

  const limit = filters.limit_n ?? DEFAULT_LIMIT;

  const fetchEvents = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        let query = supabase
          .from('events')
          .select('*, businesses(id, name, logo_url, category)')
          .eq('status', 'published')
          .order('start_at', { ascending: true })
          .range(currentOffset, currentOffset + limit - 1);

        if (filters.city) {
          query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.business_id) {
          query = query.eq('business_id', filters.business_id);
        }
        if (filters.event_type) {
          query = query.eq('type', filters.event_type);
        }
        if (filters.from_date) {
          query = query.gte('start_at', filters.from_date);
        } else {
          // Default: only show upcoming events
          query = query.gte('start_at', new Date().toISOString());
        }

        const { data: rows, error: err } = await query;

        if (err) throw err;

        const results = (rows ?? []) as unknown as EventRow[];

        if (reset) {
          setData(results);
          setOffset(limit);
        } else {
          setData((prev) => [...prev, ...results]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(results.length === limit);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), offset]
  );

  // Re-fetch from scratch whenever filters change
  useEffect(() => {
    fetchEvents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const refetch   = useCallback(() => fetchEvents(true), [fetchEvents]);
  const fetchMore = useCallback(() => {
    if (!loading && hasMore) fetchEvents(false);
  }, [loading, hasMore, fetchEvents]);

  return { data, loading, error, refetch, fetchMore, hasMore };
}

// ---------------------------------------------------------------------------
// useEvent — single event detail
// ---------------------------------------------------------------------------

export function useEvent(id: string) {
  const [data, setData]       = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: err } = await supabase
        .from('events')
        .select('*, businesses(id, name, logo_url, category)')
        .eq('id', id)
        .single();

      if (err) throw err;
      setData(row as unknown as EventDetail);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load event.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { data, loading, error, refetch: fetchEvent };
}

// ---------------------------------------------------------------------------
// useRSVP — toggle RSVP via event_rsvps table
// ---------------------------------------------------------------------------

export type RsvpStatus = 'going' | 'interested' | null;

export function useRSVP(eventId: string) {
  const user = useAuthStore((s) => s.user);

  const [rsvpd, setRsvpd]     = useState<RsvpStatus>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Load current RSVP status on mount
  useEffect(() => {
    if (!user || !eventId) return;

    supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRsvpd((data?.status as RsvpStatus) ?? null);
      });
  }, [user, eventId]);

  /**
   * Toggle RSVP for the given status.
   * - If the user has the same status already, remove the RSVP entirely.
   * - Otherwise upsert the new status.
   */
  const toggle = useCallback(
    async (status: 'going' | 'interested'): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };

      setLoading(true);
      setError(null);

      try {
        if (rsvpd === status) {
          // Remove RSVP
          const { error: err } = await supabase
            .from('event_rsvps')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', user.id);
          if (err) throw err;
          setRsvpd(null);
        } else {
          // Upsert RSVP (handles both insert and status change)
          const { error: err } = await supabase
            .from('event_rsvps')
            .upsert(
              { event_id: eventId, user_id: user.id, status },
              { onConflict: 'event_id,user_id' }
            );
          if (err) throw err;
          setRsvpd(status);
        }
        return { error: null };
      } catch (err: any) {
        const msg = err?.message ?? 'Failed to update RSVP.';
        setError(msg);
        return { error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user, eventId, rsvpd]
  );

  return { rsvpd, toggle, loading, error };
}
