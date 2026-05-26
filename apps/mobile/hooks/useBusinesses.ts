// =============================================================================
// useBusinesses — fetch and filter businesses via Supabase RPC + direct queries
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BusinessFilters {
  search_query?: string;
  lat?: number;
  lng?: number;
  radius_miles?: number;
  filter_badges?: string[];
  filter_verified?: boolean;
  filter_city?: string;
  limit_n?: number;
  offset_n?: number;
}

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  average_rating: number | null;
  total_reviews: number;
  is_featured: boolean;
  is_local_owned: boolean;
  is_community_owned: boolean;
  is_veteran_owned: boolean;
  is_woman_owned: boolean;
  verification_level: string;
  hiring_now: boolean;
  has_upcoming_event: boolean;
  has_free_today: boolean;
  status: string;
  distance_miles?: number | null;
}

export interface BusinessDetail extends BusinessSummary {
  description: string | null;
  address: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: Record<string, unknown> | null;
  business_photos: Array<{ id: string; url: string; caption: string | null }>;
  business_services: Array<{ id: string; name: string; description: string | null; price: number | null }>;
  business_social: Array<{ platform: string; handle: string; url: string }>;
}

// ---------------------------------------------------------------------------
// useBusinesses — paginated list via search_businesses RPC
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20;

export function useBusinesses(filters: BusinessFilters = {}) {
  const [data, setData]       = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset]   = useState(0);

  const limit = filters.limit_n ?? DEFAULT_LIMIT;

  const fetchBusinesses = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        const { data: rows, error: rpcError } = await supabase.rpc('search_businesses', {
          search_query:   filters.search_query   ?? null,
          lat:            filters.lat            ?? null,
          lng:            filters.lng            ?? null,
          radius_miles:   filters.radius_miles   ?? null,
          filter_badges:  filters.filter_badges  ?? null,
          filter_verified: filters.filter_verified ?? null,
          filter_city:    filters.filter_city    ?? null,
          limit_n:        limit,
          offset_n:       currentOffset,
        });

        if (rpcError) throw rpcError;

        const results = (rows ?? []) as BusinessSummary[];

        if (reset) {
          setData(results);
          setOffset(limit);
        } else {
          setData((prev) => [...prev, ...results]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(results.length === limit);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load businesses.');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), offset]
  );

  // Re-fetch from scratch whenever filters change
  useEffect(() => {
    fetchBusinesses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const refetch  = useCallback(() => fetchBusinesses(true), [fetchBusinesses]);
  const fetchMore = useCallback(() => {
    if (!loading && hasMore) fetchBusinesses(false);
  }, [loading, hasMore, fetchBusinesses]);

  return { data, loading, error, refetch, fetchMore, hasMore };
}

// ---------------------------------------------------------------------------
// useBusiness — single business with photos, services, and social
// ---------------------------------------------------------------------------

export function useBusiness(id: string) {
  const [data, setData]       = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: err } = await supabase
        .from('businesses')
        .select('*, business_photos(*), business_services(*), business_social(*)')
        .eq('id', id)
        .single();

      if (err) throw err;
      setData(row as unknown as BusinessDetail);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load business.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ---------------------------------------------------------------------------
// useFollowBusiness — toggle follow/unfollow via business_followers table
// ---------------------------------------------------------------------------

export function useFollowBusiness(businessId: string) {
  const user = useAuthStore((s) => s.user);

  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Check current follow state on mount
  useEffect(() => {
    if (!user || !businessId) return;

    supabase
      .from('business_followers')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
      });
  }, [user, businessId]);

  const toggle = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      if (following) {
        const { error: err } = await supabase
          .from('business_followers')
          .delete()
          .eq('business_id', businessId)
          .eq('user_id', user.id);
        if (err) throw err;
        setFollowing(false);
      } else {
        const { error: err } = await supabase
          .from('business_followers')
          .insert({ business_id: businessId, user_id: user.id });
        if (err) throw err;
        setFollowing(true);
      }
      return { error: null };
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to update follow status.';
      setError(msg);
      return { error: msg };
    } finally {
      setLoading(false);
    }
  }, [user, businessId, following]);

  return { following, toggle, loading, error };
}
