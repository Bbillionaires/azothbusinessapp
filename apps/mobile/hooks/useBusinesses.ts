// =============================================================================
// useBusinesses — fetch and filter businesses from Supabase
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BusinessCard } from '../../../packages/shared/src/types/business';

interface BusinessFilters {
  category?: string;
  isLocalOwned?: boolean;
  isCommunityOwned?: boolean;
  isVeteranOwned?: boolean;
  isWomanOwned?: boolean;
  hiringNow?: boolean;
  hasFreeToday?: boolean;
  hasUpcomingEvent?: boolean;
  searchQuery?: string;
  city?: string;
  state?: string;
}

interface UseBusinessesResult {
  businesses: BusinessCard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  fetchMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function useBusinesses(filters: BusinessFilters = {}): UseBusinessesResult {
  const [businesses, setBusinesses] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchBusinesses = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : page;
      let query = supabase
        .from('businesses')
        .select(
          'id, name, slug, logo_url, cover_url, category, city, state, average_rating, total_reviews, is_featured, is_local_owned, is_community_owned, is_veteran_owned, is_woman_owned, verification_level, hiring_now, has_upcoming_event, has_free_today, status'
        )
        .eq('status', 'active')
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.isLocalOwned) query = query.eq('is_local_owned', true);
      if (filters.isCommunityOwned) query = query.eq('is_community_owned', true);
      if (filters.isVeteranOwned) query = query.eq('is_veteran_owned', true);
      if (filters.isWomanOwned) query = query.eq('is_woman_owned', true);
      if (filters.hiringNow) query = query.eq('hiring_now', true);
      if (filters.hasFreeToday) query = query.eq('has_free_today', true);
      if (filters.hasUpcomingEvent) query = query.eq('has_upcoming_event', true);
      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters.state) query = query.eq('state', filters.state);
      if (filters.searchQuery) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      const results = (data ?? []) as BusinessCard[];
      if (reset) {
        setBusinesses(results);
        setPage(1);
      } else {
        setBusinesses((prev) => [...prev, ...results]);
        setPage((p) => p + 1);
      }
      setHasMore(results.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load businesses.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchBusinesses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const refetch = useCallback(() => fetchBusinesses(true), [fetchBusinesses]);
  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) fetchBusinesses(false);
  }, [isLoading, hasMore, fetchBusinesses]);

  return { businesses, isLoading, error, refetch, fetchMore, hasMore };
}

export function useBusiness(id: string) {
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    supabase
      .from('businesses')
      .select('*, business_photos(*), business_services(*), business_social(*)')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setBusiness(data);
        setIsLoading(false);
      });
  }, [id]);

  return { business, isLoading, error };
}
