import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type Offer = {
  id: string; title: string; description: string | null; offer_type: string;
  discount_percent: number | null; discount_amount: number | null;
  promo_code: string | null; expires_at: string | null;
  starts_at: string; is_active: boolean; max_redemptions: number | null;
  current_redemptions: number; points_bonus: number; image_url: string | null;
  business_id: string;
  businesses?: { id: string; name: string; city: string; state: string } | null;
};

type RedeemResult = { success: boolean; error?: string; offer_title?: string; points_bonus?: number };

interface OffersFilters {
  business_id?: string;
  offer_type?: string;
  featured_only?: boolean;
  limit?: number;
}

export function useOffers(filters: OffersFilters = {}) {
  const [data, setData] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('business_offers')
        .select('*, businesses(id, name, city, state)')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(filters.limit ?? 30);

      if (filters.business_id) query = query.eq('business_id', filters.business_id);
      if (filters.offer_type) query = query.eq('offer_type', filters.offer_type);
      if (filters.featured_only) query = query.eq('is_featured', true);

      const { data: offers, error: err } = await query;
      if (err) throw err;
      setData((offers ?? []) as Offer[]);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [filters.business_id, filters.offer_type, filters.featured_only, filters.limit]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  return { data, loading, error, refetch: fetchOffers };
}

export function useOffer(id: string) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('business_offers')
        .select('*, businesses(name)')
        .eq('id', id)
        .single();
      if (err) setError(err.message);
      else setOffer(data as any);
      setLoading(false);
    }
    load();
  }, [id]);

  return { offer, loading, error };
}

export function useRedeemOffer() {
  const { user } = useAuthStore();
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  const redeem = useCallback(async (offerId: string): Promise<RedeemResult> => {
    if (!user) return { success: false, error: 'You must be signed in to redeem offers.' };
    setRedeeming(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc('redeem_offer', {
        p_offer_id: offerId,
        p_user_id: user.id,
      });
      const res: RedeemResult = data as RedeemResult ?? { success: false, error: error?.message ?? 'Unknown error' };
      setResult(res);
      return res;
    } catch (err: any) {
      const res: RedeemResult = { success: false, error: err.message };
      setResult(res);
      return res;
    } finally {
      setRedeeming(false);
    }
  }, [user]);

  return { redeem, redeeming, result };
}
