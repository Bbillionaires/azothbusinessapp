import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase';
import type { AdminRole } from '@/lib/supabase';

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin'];

export const revalidate = 60;

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
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [
      totalUsersRes,
      totalBizRes,
      activeBizRes,
      pendingReceiptsRes,
      flaggedReceiptsRes,
      pointsTodayRes,
      revenueMonthRes,
      activeAdRes,
      openDisputesRes,
    ] = await Promise.all([
      svc.from('profiles').select('id', { count: 'exact', head: true }),
      svc.from('businesses').select('id', { count: 'exact', head: true }),
      svc.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      svc.from('receipts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      svc.from('receipts').select('id', { count: 'exact', head: true }).gte('fraud_score', 90).in('status', ['pending', 'flagged']),
      svc.from('points_transactions').select('amount').gte('created_at', todayStart).eq('transaction_type', 'earn'),
      svc.from('receipts').select('amount').eq('status', 'approved').gte('submitted_at', monthStart),
      svc.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      svc.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    const pointsIssuedToday = (pointsTodayRes.data ?? []).reduce(
      (s: number, r: { amount: number }) => s + (r.amount ?? 0), 0
    );

    const revenueThisMonth = (revenueMonthRes.data ?? []).reduce(
      (s: number, r: { amount: number }) => s + (r.amount ?? 0), 0
    );

    return NextResponse.json({
      totalUsers: totalUsersRes.count ?? 0,
      totalBusinesses: totalBizRes.count ?? 0,
      activeBusinesses: activeBizRes.count ?? 0,
      receiptsPendingReview: pendingReceiptsRes.count ?? 0,
      receiptsFlaggedFraud: flaggedReceiptsRes.count ?? 0,
      pointsIssuedToday,
      revenueThisMonth,
      activeAdCampaigns: activeAdRes.count ?? 0,
      openDisputes: openDisputesRes.count ?? 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('platform stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
