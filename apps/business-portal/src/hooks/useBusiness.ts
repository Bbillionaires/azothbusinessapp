'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

export interface BusinessProfile {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  category: string | null;
  tags: string[];
  family_name: string | null;
  year_founded: number | null;
  referral_type: 'percentage' | 'fixed' | null;
  referral_value: number | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  verification_tier: string | null;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
}

export function useBusiness() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBusiness(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

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
        .upsert({ ...updates, owner_id: user.id, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (updateError) throw updateError;
      setBusiness(data);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update business');
    }
  }, [supabase]);

  return { business, loading, error, refetch: fetchBusiness, updateBusiness };
}
