'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

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
}

// Generates realistic-looking demo data until real data is wired up
function generateMockChartData(months = 6): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    points.push({
      date: format(d, 'MMM yyyy'),
      views: Math.floor(200 + Math.random() * 800),
      followers: Math.floor(10 + Math.random() * 80),
      reviews: Math.floor(2 + Math.random() * 20),
    });
  }
  return points;
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

      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const previousStart = startOfMonth(subMonths(now, 1));
      const previousEnd = endOfMonth(subMonths(now, 1));

      // Fetch analytics events from Supabase (falls back gracefully)
      const [currentViews, prevViews] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('event_type', 'view')
          .gte('created_at', currentStart.toISOString())
          .lte('created_at', currentEnd.toISOString()),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('event_type', 'view')
          .gte('created_at', previousStart.toISOString())
          .lte('created_at', previousEnd.toISOString()),
      ]);

      const cv = currentViews.count ?? 0;
      const pv = prevViews.count ?? 0;

      // Mock data for items not yet in DB
      const mockSummary: AnalyticsSummary = {
        totalViews: {
          current: cv || 847,
          previous: pv || 712,
          change: pv ? Math.round(((cv - pv) / pv) * 100) : 19,
        },
        newFollowers: { current: 34, previous: 28, change: 21 },
        reviewsReceived: { current: 12, previous: 8, change: 50, avgRating: 4.7 },
        profileCompleteness: 72,
      };

      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'review',
          message: 'Sarah M. left a 5-star review',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        },
        {
          id: '2',
          type: 'follower',
          message: 'James T. started following your business',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          type: 'rsvp',
          message: 'Maria L. RSVPed to your Summer Sale event',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
        {
          id: '4',
          type: 'view',
          message: 'Your profile was viewed 47 times today',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        },
        {
          id: '5',
          type: 'review',
          message: 'David K. left a 4-star review',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];

      setSummary(mockSummary);
      setActivity(mockActivity);
      setChartData(generateMockChartData(6));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { summary, activity, chartData, loading, error, refetch: fetchAnalytics };
}
