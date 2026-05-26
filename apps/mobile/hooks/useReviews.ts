import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type Review = {
  id: string; rating: number; title: string | null; body: string; tags: string[] | null;
  status: string; weighted_score: number; helpful_count: number;
  created_at: string; reviewer_id: string;
  profiles?: { full_name: string | null; avatar_url: string | null; tier: string | null } | null;
  review_responses?: Array<{ body: string; created_at: string }>;
};

export function useBusinessReviews(businessId: string, limit = 20) {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data: reviews, count, error: err } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url, tier), review_responses(body, created_at)', { count: 'exact' })
        .eq('business_id', businessId)
        .eq('status', 'published')
        .order('weighted_score', { ascending: false })
        .limit(limit);

      if (err) throw err;
      setData((reviews ?? []) as Review[]);
      setTotal(count ?? 0);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, total, avgRating, refetch: fetch };
}

export function useMyReviews() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*, businesses!inner(name)')
        .eq('reviewer_id', user!.id)
        .order('created_at', { ascending: false });
      setData((reviews ?? []) as any[]);
      setLoading(false);
    }
    load();
  }, [user]);

  return { data, loading };
}

export function useMarkHelpful() {
  const { user } = useAuthStore();

  const toggle = useCallback(async (reviewId: string, currentlyHelpful: boolean) => {
    if (!user) return;
    if (currentlyHelpful) {
      await supabase.from('review_helpful').delete().eq('review_id', reviewId).eq('user_id', user.id);
    } else {
      await supabase.from('review_helpful').insert({ review_id: reviewId, user_id: user.id });
    }
  }, [user]);

  return { toggle };
}
