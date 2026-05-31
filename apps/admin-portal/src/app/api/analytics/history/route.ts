import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';;
import type { AdminRole } from '@/lib/supabase';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin'];

export const revalidate = 300;

export async function GET() {
  try {
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerProfile } = await authClient
      .from('profiles').select('role').eq('id', user.id).single();
    if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = createSupabaseServiceClient();

    // Build last 6 months date ranges
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      return {
        label: format(d, 'MMM'),
        start: startOfMonth(d).toISOString().split('T')[0],
        end: endOfMonth(d).toISOString().split('T')[0],
      };
    });

    // Pull from economic_dashboard_data (populated by compute-analytics edge function)
    const { data: dashboardRows } = await svc
      .from('economic_dashboard_data')
      .select('period_start, period_end, total_local_spending, total_community_spending, receipt_volume, total_active_businesses, active_consumers, new_consumers')
      .eq('period_type', 'monthly')
      .gte('period_start', months[0].start)
      .lte('period_end', months[5].end)
      .order('period_start', { ascending: true });

    // Pull monthly user counts from profiles (real data)
    const userCountByMonth: Record<string, number> = {};
    for (const m of months) {
      const { count } = await svc
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .lte('created_at', m.end + 'T23:59:59Z');
      userCountByMonth[m.label] = count ?? 0;
    }

    // Pull monthly receipt counts
    const receiptsByMonth: Record<string, number> = {};
    for (const m of months) {
      const { count } = await svc
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', m.start)
        .lte('created_at', m.end + 'T23:59:59Z')
        .eq('status', 'approved');
      receiptsByMonth[m.label] = count ?? 0;
    }

    // Pull monthly points issued
    const pointsByMonth: Record<string, number> = {};
    for (const m of months) {
      const { data: pts } = await svc
        .from('points_transactions')
        .select('amount')
        .gte('created_at', m.start)
        .lte('created_at', m.end + 'T23:59:59Z')
        .gt('amount', 0);
      pointsByMonth[m.label] = (pts ?? []).reduce((s, r) => s + r.amount, 0);
    }

    // Pull monthly active businesses
    const bizByMonth: Record<string, number> = {};
    for (const m of months) {
      const { count } = await svc
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('created_at', m.end + 'T23:59:59Z');
      bizByMonth[m.label] = count ?? 0;
    }

    // Build platform growth chart data
    const platformGrowth = months.map(m => {
      const row = (dashboardRows ?? []).find(r =>
        r.period_start <= m.end && r.period_end >= m.start
      );
      return {
        month: m.label,
        users: userCountByMonth[m.label] ?? 0,
        businesses: bizByMonth[m.label] ?? 0,
        receipts: receiptsByMonth[m.label] ?? (row?.receipt_volume ?? 0),
        points: pointsByMonth[m.label] ?? 0,
      };
    });

    // Build economic impact chart data
    const economicImpact = months.map(m => {
      const row = (dashboardRows ?? []).find(r =>
        r.period_start <= m.end && r.period_end >= m.start
      );
      return {
        month: m.label,
        local_spend: row ? Number(row.total_local_spending) : 0,
        community_spend: row ? Number(row.total_community_spending) : 0,
      };
    });

    return NextResponse.json({ platformGrowth, economicImpact }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('analytics history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
