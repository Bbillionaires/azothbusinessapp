// =============================================================================
// useRewards — reward catalog, points history, redemptions
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RewardCatalogItem {
  id: string;
  business_id: string | null;
  name: string;
  description: string | null;
  type: string;
  points_cost: number;
  quantity_available: number | null;
  quantity_redeemed: number;
  is_active: boolean;
  expires_at: string | null;
  image_url: string | null;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  redeemed_at: string | null;
  created_at: string;
  reward_catalog?: {
    name: string;
    points_cost: number;
    type: string;
  } | null;
}

// ---------------------------------------------------------------------------
// useRewards — active reward catalog
// ---------------------------------------------------------------------------

export function useRewards() {
  const [data, setData]       = useState<RewardCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('reward_catalog')
        .select('*, businesses(id, name, logo_url)')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (err) throw err;
      setData((rows ?? []) as unknown as RewardCatalogItem[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { data, loading, error, refetch: fetchCatalog };
}

// ---------------------------------------------------------------------------
// usePointsHistory — paginated points_transactions for current user
// ---------------------------------------------------------------------------

export function usePointsHistory(limit = 20) {
  const user = useAuthStore((s) => s.user);

  const [data, setData]       = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) throw err;
      setData((rows ?? []) as unknown as PointsTransaction[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load points history.');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, loading, error, refetch: fetchHistory };
}

// ---------------------------------------------------------------------------
// useRedemptions — reward_redemptions joined with reward_catalog
// ---------------------------------------------------------------------------

export function useRedemptions() {
  const user = useAuthStore((s) => s.user);

  const [data, setData]       = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchRedemptions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('reward_redemptions')
        .select('*, reward_catalog(name, points_cost, type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      setData((rows ?? []) as unknown as RewardRedemption[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load redemptions.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  return { data, loading, error, refetch: fetchRedemptions };
}

// ---------------------------------------------------------------------------
// useRedeemReward — call redeem_reward RPC
// ---------------------------------------------------------------------------

export function useRedeemReward() {
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const redeem = useCallback(
    async (rewardId: string): Promise<{ data: unknown; error: string | null }> => {
      if (!user) return { data: null, error: 'Not authenticated' };

      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('redeem_reward', {
          p_reward_id: rewardId,
          p_user_id:   user.id,
        });

        if (rpcError) throw rpcError;
        return { data, error: null };
      } catch (err: any) {
        const msg = err?.message ?? 'Redemption failed.';
        setError(msg);
        return { data: null, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { redeem, loading, error };
}
