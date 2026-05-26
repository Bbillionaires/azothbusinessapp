'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { subMonths, format, startOfMonth } from 'date-fns';

export interface AnalyticsSummary {
  totalViews: { current: number; previous: number; change: number };
  newFollowers: { current: number; previous: number; change: number };
  reviewsReceived: { current: number; previous: number; change: number; avgRating: number };
  profileCompleteness: number;
}

export interface ActivityItem {
  id: string;
  type: 'review' | 'follower' | 'rsvp' | 'view';
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface ChartDataPoint {
  date: string;
  views: number;
  followers: number;
  reviews: number;
  revenue: number;
}

export function useAnalytics(businessId?: string) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    if (!businessId) return;
    try {
      setLoading(true);

      const sixMonthsAgo = subMonths(new Date(), 6).toISOString().split('T')[0];

      const [analyticsRes, reviewsResult, recentReviewsResult] = await Promise.all([
        supabase
          .from('business_analytics')
          .select('period_start, profile_views, new_followers, total_followers, new_reviews, avg_rating_period, receipt_count, receipt_total')
          .eq('business_id', businessId)
          .eq('period_type', 'monthly')
          .gte('period_start', sixMonthsAgo)
          .order('period_start', { ascending: true }),
        supabase
          .from('reviews')
          .select('id, rating, created_at, profiles(full_name)')
          .eq('business_id', businessId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('reviews')
          .select('id, rating, created_at')
          .eq('business_id', businessId)
          .eq('status', 'published'),
      ]);

      const analyticsRows = analyticsRes.data ?? [];
      const recentReviews = reviewsResult.data ?? [];
      const allReviews = recentReviewsResult.data ?? [];

      // Build chart data from business_analytics rows; fill missing months with zeros
      const chartPoints: ChartDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = startOfMonth(monthDate).toISOString().split('T')[0];
        const row = analyticsRows.find(r => r.period_start.startsWith(monthKey.slice(0, 7)));
        chartPoints.push({
          date: format(monthDate, 'MMM yyyy'),
          views: row?.profile_views ?? 0,
          followers: row?.new_followers ?? 0,
          reviews: row?.new_reviews ?? 0,
          revenue: Math.round((row?.receipt_total as number) ?? 0),
        });
      }

      // Summary from most recent two months
      const currentMonth = analyticsRows[analyticsRows.length - 1];
      const prevMonth = analyticsRows[analyticsRows.length - 2];

      const currentViews = currentMonth?.profile_views ?? 0;
      const prevViews = prevMonth?.profile_views ?? 0;
      const currentFollowers = currentMonth?.total_followers ?? 0;
      const prevFollowers = prevMonth?.total_followers ?? 0;
      const currentReviews = currentMonth?.new_reviews ?? allReviews.length;
      const prevReviews = prevMonth?.new_reviews ?? 0;
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length
        : 0;

      const pct = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

      setSummary({
        totalViews: { current: currentViews, previous: prevViews, change: pct(currentViews, prevViews) },
        newFollowers: { current: currentFollowers, previous: prevFollowers, change: pct(currentFollowers, prevFollowers) },
        reviewsReceived: { current: currentReviews, previous: prevReviews, change: pct(currentReviews, prevReviews), avgRating: Math.round(avgRating * 10) / 10 },
        profileCompleteness: 72,
      });

      const activityItems: ActivityItem[] = recentReviews.map((r: any) => ({
        id: r.id,
        type: 'review' as const,
        message: `${(r.profiles as any)?.full_name ?? 'Someone'} left a ${r.rating}-star review`,
        timestamp: r.created_at,
      }));

      setActivity(activityItems.length > 0 ? activityItems : [
        { id: '1', type: 'view', message: 'Your profile is live and discoverable', timestamp: new Date().toISOString() },
      ]);
      setChartData(chartPoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { summary, activity, chartData, loading, error, refetch: fetchAnalytics };
}
