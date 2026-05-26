// =============================================================================
// useRewards — points balance, catalog, redemption history
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type {
  RewardCatalogWithBusiness,
  RedemptionWithReward,
  PointsTransaction,
} from '../../../packages/shared/src/types/rewards';

interface UseRewardsResult {
  catalog: RewardCatalogWithBusiness[];
  redemptions: RedemptionWithReward[];
  transactions: PointsTransaction[];
  isLoading: boolean;
  error: string | null;
  redeemReward: (rewardId: string) => Promise<{ error: string | null }>;
  refetch: () => void;
}

export function useRewards(): UseRewardsResult {
  const { user, profile } = useAuth();
  const [catalog, setCatalog] = useState<RewardCatalogWithBusiness[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionWithReward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [catalogRes, redemptionsRes, txRes] = await Promise.all([
        supabase
          .from('reward_catalog')
          .select('*, businesses(id, name, logo_url)')
          .eq('is_active', true)
          .order('points_cost', { ascending: true }),
        supabase
          .from('reward_redemptions')
          .select('*, reward_catalog(name, points_cost, reward_type)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (catalogRes.error) throw catalogRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;
      if (txRes.error) throw txRes.error;

      setCatalog((catalogRes.data ?? []) as unknown as RewardCatalogWithBusiness[]);
      setRedemptions((redemptionsRes.data ?? []) as unknown as RedemptionWithReward[]);
      setTransactions((txRes.data ?? []) as unknown as PointsTransaction[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load rewards.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const redeemReward = useCallback(
    async (rewardId: string) => {
      if (!user || !profile) return { error: 'Not authenticated' };

      const reward = catalog.find((r) => r.id === rewardId);
      if (!reward) return { error: 'Reward not found' };
      if (profile.points_balance < reward.points_cost) {
        return { error: 'Insufficient points' };
      }

      try {
        const { error: err } = await supabase.from('reward_redemptions').insert({
          user_id: user.id,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          status: 'pending',
        });
        if (err) throw err;
        await fetchRewards();
        return { error: null };
      } catch (err: any) {
        return { error: err?.message ?? 'Redemption failed.' };
      }
    },
    [user, profile, catalog, fetchRewards]
  );

  return { catalog, redemptions, transactions, isLoading, error, redeemReward, refetch: fetchRewards };
}
