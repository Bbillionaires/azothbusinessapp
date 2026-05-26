'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export interface BusinessProfile {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  family_name: string | null;
  year_founded: number | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  status: string;
  is_local_owned: boolean;
  is_community_owned: boolean;
  is_veteran_owned: boolean;
  is_nonprofit_owned: boolean;
  is_woman_owned: boolean;
  verification_level: string | null;
  is_featured: boolean;
  is_top_rated: boolean;
  is_premium: boolean;
  hiring_now: boolean;
  has_free_today: boolean;
  has_upcoming_event: boolean;
  referral_percentage: number | null;
  referral_fixed_amount: number | null;
  total_reviews: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string | null;
  business_social: Array<{ id: string; platform: string; url: string }> | null;
  business_photos: Array<{ id: string; url: string; is_cover: boolean }> | null;
  business_services: Array<{ id: string; name: string; price: number | null }> | null;
}

export function useBusiness() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBusiness(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*, business_social(*), business_photos(*), business_services(*)')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setBusiness(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch business');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const updateBusiness = useCallback(async (updates: Partial<BusinessProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('owner_id', user.id)
        .select('*, business_social(*), business_photos(*), business_services(*)')
        .maybeSingle();

      if (updateError) throw updateError;
      if (data) setBusiness(data);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update business');
    }
  }, [supabase]);

  return { business, loading, error, refetch: fetchBusiness, updateBusiness };
}
