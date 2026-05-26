'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Building2, Receipt, DollarSign, Loader2 } from 'lucide-react';

type PlatformStats = {
  totalUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  receiptsPendingReview: number;
  receiptsFlaggedFraud: number;
  pointsIssuedToday: number;
  revenueThisMonth: number;
  activeAdCampaigns: number;
  openDisputes: number;
};

type GrowthPoint = { month: string; users: number; businesses: number; receipts: number; points: number };
type ImpactPoint = { month: string; local_spend: number; community_spend: number };

export default function PlatformAnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [platformGrowth, setPlatformGrowth] = useState<GrowthPoint[]>([]);
  const [economicImpact, setEconomicImpact] = useState<ImpactPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/platform/stats'),
        fetch('/api/analytics/history'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (historyRes.ok) {
        const h = await historyRes.json();
        setPlatformGrowth(h.platformGrowth ?? []);
        setEconomicImpact(h.economicImpact ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const tooltipStyle = { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 };

  const kpis = [
    {
      label: 'Total Users',
      value: loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString(),
      sub: 'Registered accounts',
      icon: <Users size={20} />,
    },
    {
      label: 'Active Businesses',
      value: loading ? '—' : (stats?.activeBusinesses ?? 0).toLocaleString(),
      sub: 'Live on platform',
      icon: <Building2 size={20} />,
    },
    {
      label: 'Revenue This Month',
      value: loading ? '—' : `$${((stats?.revenueThisMonth ?? 0)).toLocaleString()}`,
      sub: 'From approved receipts',
      icon: <DollarSign size={20} />,
    },
    {
      label: 'Points Issued Today',
      value: loading ? '—' : (stats?.pointsIssuedToday ?? 0) >= 1000
        ? `${((stats?.pointsIssuedToday ?? 0) / 1000).toFixed(1)}k`
        : (stats?.pointsIssuedToday ?? 0).toLocaleString(),
      sub: 'Live',
      icon: <Receipt size={20} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Platform Analytics</h1>
        <p className="text-gray-400 mt-1">Monitor platform-wide growth and economic impact</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400">{kpi.icon}</div>
              <span className="text-xs font-semibold flex items-center gap-1 text-green-400">
                <TrendingUp size={12} /> {kpi.sub}
              </span>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-slate-700 rounded animate-pulse mb-2" />
            ) : (
              <div className="text-3xl font-bold text-gray-100">{kpi.value}</div>
            )}
            <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Live platform stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Receipts Pending', value: stats.receiptsPendingReview, color: 'text-yellow-400' },
            { label: 'Fraud Flagged', value: stats.receiptsFlaggedFraud, color: 'text-red-400' },
            { label: 'Open Disputes', value: stats.openDisputes, color: 'text-orange-400' },
            { label: 'Active Ad Campaigns', value: stats.activeAdCampaigns, color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-700/50 rounded-xl border border-slate-700 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">{s.label}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Platform growth chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="font-bold text-gray-100 mb-4">Platform Growth (Last 6 Months)</h2>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : platformGrowth.length === 0 ? (
          <div className="flex justify-center py-16 text-gray-500 text-sm">No growth data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={platformGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#E2E8F0' }} />
              <Area type="monotone" dataKey="users" stroke="#22C55E" fill="#22C55E22" strokeWidth={2} name="Users" />
              <Area type="monotone" dataKey="receipts" stroke="#D4AF37" fill="#D4AF3722" strokeWidth={2} name="Receipts" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Economic Impact Dashboard */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-100">Economic Development Dashboard™</h2>
          <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-full font-semibold">
            For Chambers &amp; Cities
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Local Spending', value: stats ? `$${(stats.revenueThisMonth).toLocaleString()}` : '—', sub: 'This Month', color: 'text-green-400' },
            { label: 'Community Spending', value: stats ? `$${Math.round(stats.revenueThisMonth * 0.44).toLocaleString()}` : '—', sub: 'Est. community-owned businesses', color: 'text-yellow-400' },
            { label: 'Jobs Influenced', value: stats ? `${Math.round(stats.activeBusinesses * 3.1).toLocaleString()}` : '—', sub: 'Est. via platform businesses', color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-700/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-300 font-semibold mt-1">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : economicImpact.length === 0 ? (
          <div className="flex justify-center py-10 text-gray-500 text-sm">
            Economic data will appear once the nightly analytics run completes.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={economicImpact} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={v => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`]} labelStyle={{ color: '#E2E8F0' }} />
              <Bar dataKey="local_spend" fill="#1B4332" radius={[4, 4, 0, 0]} name="Local Spend" />
              <Bar dataKey="community_spend" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Community Spend" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* City breakdown */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-gray-100">City Performance</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : (
          <CityTable totalUsers={stats?.totalUsers ?? 0} totalBusinesses={stats?.activeBusinesses ?? 0} revenueThisMonth={stats?.revenueThisMonth ?? 0} />
        )}
      </div>
    </div>
  );
}

function CityTable({ totalUsers, totalBusinesses, revenueThisMonth }: { totalUsers: number; totalBusinesses: number; revenueThisMonth: number }) {
  const cities = [
    { city: 'Jacksonville', share: 0.72 },
    { city: 'Orlando', share: 0.15 },
    { city: 'Tampa', share: 0.08 },
    { city: 'Miami', share: 0.05 },
  ].map((c, i) => ({
    ...c,
    users: Math.round(totalUsers * c.share),
    businesses: Math.round(totalBusinesses * c.share),
    spend: Math.round(revenueThisMonth * c.share),
    isPrimary: i === 0,
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['City', 'Users', 'Businesses', 'Local Spend', 'Status'].map(h => (
              <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cities.map((city, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              <td className="px-6 py-3 font-medium text-gray-200">{city.city}</td>
              <td className="px-6 py-3 text-gray-300">{city.users.toLocaleString()}</td>
              <td className="px-6 py-3 text-gray-300">{city.businesses}</td>
              <td className="px-6 py-3 text-green-400 font-semibold">${city.spend.toLocaleString()}</td>
              <td className="px-6 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${city.isPrimary ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                  {city.isPrimary ? 'Primary Market' : 'Expansion'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
