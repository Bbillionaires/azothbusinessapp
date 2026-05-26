'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Users, Star, DollarSign, Receipt, Gift, RefreshCw } from 'lucide-react';
import { useBusiness } from '@/hooks/useBusiness';

const PERIOD_OPTIONS = ['7 days', '30 days', '90 days', '12 months'];

type AnalyticsSummary = {
  business: { id: string; name: string };
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_pct: number | null;
  };
  receipts: { total: number; this_month: number; avg_amount: number };
  reviews: { total: number; avg_rating: number; weighted_avg: number };
  followers: { total: number; new_this_month: number };
  offers: { total_redemptions: number; this_month: number };
  top_customers: { user_id: string; total_spent: number }[];
  weekly_spending: { week: string; amount: number }[];
};

function formatShortDate(isoWeek: string): string {
  const d = new Date(isoWeek);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-gray-100 mb-3" />
      <div className="h-8 w-20 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-28 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-16 bg-gray-100 rounded" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30 days');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { business } = useBusiness();

  useEffect(() => {
    if (!business?.id) return;
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/summary?business_id=${business!.id}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json: AnalyticsSummary = await res.json();
        setSummary(json);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [business?.id]);

  const weeklyChartData = (summary?.weekly_spending ?? []).map(w => ({
    date: formatShortDate(w.week),
    amount: w.amount,
  }));

  const kpis = summary ? [
    {
      label: 'Revenue This Month',
      value: `$${summary.revenue.this_month.toLocaleString()}`,
      change: summary.revenue.growth_pct,
      icon: <DollarSign size={20} className="text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      label: 'Avg Rating',
      value: summary.reviews.avg_rating > 0 ? summary.reviews.avg_rating.toFixed(1) : '—',
      change: null,
      icon: <Star size={20} className="text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
    {
      label: 'Total Followers',
      value: summary.followers.total.toLocaleString(),
      change: summary.followers.new_this_month > 0 ? null : null,
      extra: `+${summary.followers.new_this_month} this month`,
      icon: <Users size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Offer Redemptions',
      value: summary.offers.total_redemptions.toLocaleString(),
      change: null,
      extra: `${summary.offers.this_month} this month`,
      icon: <Gift size={20} className="text-orange-600" />,
      bg: 'bg-orange-50',
    },
  ] : [];

  // Engagement breakdown using real counters
  const engagementData = summary ? [
    { label: 'Receipts', value: summary.receipts.total, color: '#1B4332' },
    { label: 'Reviews', value: summary.reviews.total, color: '#D4AF37' },
    { label: 'Followers', value: summary.followers.total, color: '#7C3AED' },
    { label: 'Redemptions', value: summary.offers.total_redemptions, color: '#059669' },
  ] : [];

  const maxEngagement = Math.max(...engagementData.map(e => e.value), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track how your business is performing</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                period === p ? 'bg-green-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-medium">{error}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                {kpi.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{kpi.label}</div>
              {kpi.change != null ? (
                <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(kpi.change)}% vs last month
                </div>
              ) : (kpi as any).extra ? (
                <div className="mt-2 text-xs text-gray-400">{(kpi as any).extra}</div>
              ) : null}
            </div>
          ))
        }
      </div>

      {/* Weekly revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Weekly Revenue (Last 8 Weeks)</h2>
        {loading ? (
          <div className="h-[220px] flex items-center justify-center">
            <RefreshCw size={20} className="animate-spin text-gray-300" />
          </div>
        ) : weeklyChartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            No revenue data yet — revenue appears as receipts are approved
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="amount" stroke="#1B4332" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Receipts this month */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-2">Receipt Summary</h2>
          {loading ? (
            <div className="h-[160px] flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-gray-300" />
            </div>
          ) : summary ? (
            <div className="space-y-4 pt-2">
              {[
                { label: 'Total Receipts', value: summary.receipts.total.toLocaleString(), icon: '🧾' },
                { label: 'This Month', value: summary.receipts.this_month.toLocaleString(), icon: '📅' },
                { label: 'Avg Receipt Amount', value: `$${summary.receipts.avg_amount.toFixed(2)}`, icon: '💵' },
                { label: 'Total Revenue', value: `$${summary.revenue.total.toLocaleString()}`, icon: '📈' },
                { label: 'Last Month Revenue', value: `$${summary.revenue.last_month.toLocaleString()}`, icon: '📊' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Engagement breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Engagement Breakdown</h2>
          {loading ? (
            <div className="h-[160px] flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="space-y-3">
              {engagementData.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-700 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(item.value / maxEngagement) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-gray-900">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews summary */}
      {summary && summary.reviews.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Review Performance</h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.reviews.avg_rating.toFixed(1)}</div>
              <div className="text-sm text-gray-500 mt-1">Average Rating</div>
              <div className="text-yellow-500 text-lg mt-1">{'★'.repeat(Math.round(summary.reviews.avg_rating))}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.reviews.total}</div>
              <div className="text-sm text-gray-500 mt-1">Total Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{summary.reviews.weighted_avg.toFixed(1)}</div>
              <div className="text-sm text-gray-500 mt-1">Weighted Score</div>
              <div className="text-xs text-gray-400 mt-1">Legend reviews count 10×</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
