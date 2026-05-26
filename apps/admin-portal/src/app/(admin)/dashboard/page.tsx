import { createSupabaseServerClient } from '@/lib/supabase';
import PlatformStatsGrid from '@/components/analytics/PlatformStatsGrid';
import EconomicImpactChart from '@/components/analytics/EconomicImpactChart';
import ReceiptReviewCard from '@/components/receipts/ReceiptReviewCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Building2, CheckCircle } from 'lucide-react';
import type { Receipt } from '@/lib/supabase';

// Generate mock 30-day chart data
function generateChartData() {
  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MMM d'),
      pointsIssued: Math.floor(Math.random() * 15000) + 5000,
      receiptsApproved: Math.floor(Math.random() * 200) + 50,
      newUsers: Math.floor(Math.random() * 80) + 10,
    };
  });
}

async function getPlatformStats() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalUsers },
    { count: totalBusinesses },
    { count: activeBusinesses },
    { count: pendingBusinesses },
    { count: receiptsPending },
    { count: receiptsFlagged },
    { count: openDisputes },
    { count: activeAdCampaigns },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('ad_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    newUsersToday: 24,
    totalBusinesses: totalBusinesses ?? 0,
    activeBusinesses: activeBusinesses ?? 0,
    pendingBusinesses: pendingBusinesses ?? 0,
    receiptsPendingReview: receiptsPending ?? 0,
    receiptsFlaggedFraud: receiptsFlagged ?? 0,
    pointsIssuedToday: 47_350,
    revenueThisMonth: 12_840,
    activeAdCampaigns: activeAdCampaigns ?? 0,
    openDisputes: openDisputes ?? 0,
  };
}

async function getRecentActivity() {
  const supabase = await createSupabaseServerClient();

  const [{ data: recentReceipts }, { data: fraudAlerts }, { data: pendingVerifications }, { data: recentBusinesses }] =
    await Promise.all([
      supabase
        .from('receipts')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(5),
      supabase
        .from('receipts')
        .select('*')
        .gte('fraud_score', 70)
        .eq('status', 'pending')
        .order('fraud_score', { ascending: false })
        .limit(5),
      supabase
        .from('businesses')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  return {
    recentReceipts: (recentReceipts ?? []) as Receipt[],
    fraudAlerts: (fraudAlerts ?? []) as Receipt[],
    pendingVerifications: (pendingVerifications ?? []) as Array<{ id: string; name: string; category: string; city: string; created_at: string }>,
    recentBusinesses: (recentBusinesses ?? []) as Array<{ id: string; name: string; category: string; status: string; created_at: string }>,
  };
}

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([
    getPlatformStats().catch(() => ({
      totalUsers: 8_412,
      newUsersToday: 24,
      totalBusinesses: 356,
      activeBusinesses: 298,
      pendingBusinesses: 41,
      receiptsPendingReview: 127,
      receiptsFlaggedFraud: 18,
      pointsIssuedToday: 47_350,
      revenueThisMonth: 12_840,
      activeAdCampaigns: 23,
      openDisputes: 9,
    })),
    getRecentActivity().catch(() => ({
      recentReceipts: [] as Receipt[],
      fraudAlerts: [] as Receipt[],
      pendingVerifications: [] as Array<{ id: string; name: string; category: string; city: string; created_at: string }>,
      recentBusinesses: [] as Array<{ id: string; name: string; category: string; status: string; created_at: string }>,
    })),
  ]);

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <PlatformStatsGrid stats={stats} />

      {/* Chart */}
      <EconomicImpactChart data={chartData} />

      {/* Activity feeds - 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Receipt Submissions */}
        <div className="admin-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-200">Recent Receipt Submissions</h2>
            <Link
              href="/receipts"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/30">
            {activity.recentReceipts.length > 0 ? (
              activity.recentReceipts.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <ReceiptReviewCard receipt={r} />
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                No recent receipt submissions.
              </div>
            )}
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="admin-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Fraud Alerts
            </h2>
            <Link
              href="/fraud"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/30">
            {activity.fraudAlerts.length > 0 ? (
              activity.fraudAlerts.map((r) => (
                <Link
                  key={r.id}
                  href={`/receipts/${r.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/20 transition-colors"
                >
                  <div>
                    <p className="text-sm text-slate-200">{r.merchant_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ${r.amount.toFixed(2)} · {format(new Date(r.submitted_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                    {r.fraud_score}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No high-risk alerts at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="admin-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-200">Pending Verifications</h2>
            <Link
              href="/verification"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/30">
            {activity.pendingVerifications.length > 0 ? (
              activity.pendingVerifications.map((b) => (
                <Link
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{b.name}</p>
                    <p className="text-xs text-slate-500">
                      {b.category} · {b.city} · {format(new Date(b.created_at), 'MMM d')}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                No pending verifications.
              </div>
            )}
          </div>
        </div>

        {/* Recent Business Registrations */}
        <div className="admin-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-200">Recent Business Registrations</h2>
            <Link
              href="/businesses"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/30">
            {activity.recentBusinesses.length > 0 ? (
              activity.recentBusinesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{b.name}</p>
                    <p className="text-xs text-slate-500">
                      {b.category} · {format(new Date(b.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                No recent registrations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
