'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Building2, Receipt, DollarSign } from 'lucide-react';

const PLATFORM_GROWTH = [
  { month: 'Dec', users: 1200, businesses: 145, receipts: 3200, points: 320000 },
  { month: 'Jan', users: 1850, businesses: 198, receipts: 4800, points: 485000 },
  { month: 'Feb', users: 2400, businesses: 234, receipts: 6200, points: 620000 },
  { month: 'Mar', users: 3100, businesses: 287, receipts: 8400, points: 840000 },
  { month: 'Apr', users: 4200, businesses: 342, receipts: 11200, points: 1120000 },
  { month: 'May', users: 5800, businesses: 412, receipts: 15600, points: 1560000 },
];

const ECONOMIC_IMPACT = [
  { month: 'Jan', local_spend: 42000, community_spend: 18000 },
  { month: 'Feb', local_spend: 58000, community_spend: 24000 },
  { month: 'Mar', local_spend: 74000, community_spend: 32000 },
  { month: 'Apr', local_spend: 95000, community_spend: 41000 },
  { month: 'May', local_spend: 128000, community_spend: 56000 },
];

const CITY_DATA = [
  { city: 'Jacksonville', users: 4200, businesses: 312, spend: 95000 },
  { city: 'Orlando', users: 890, businesses: 64, spend: 22000 },
  { city: 'Tampa', users: 420, businesses: 28, spend: 9800 },
  { city: 'Miami', users: 190, businesses: 8, spend: 4200 },
];

export default function PlatformAnalyticsPage() {
  const latest = PLATFORM_GROWTH[PLATFORM_GROWTH.length - 1];
  const prev = PLATFORM_GROWTH[PLATFORM_GROWTH.length - 2];

  const kpis = [
    {
      label: 'Total Users', value: latest.users.toLocaleString(),
      change: `+${Math.round(((latest.users - prev.users) / prev.users) * 100)}%`,
      icon: <Users size={20} />, positive: true,
    },
    {
      label: 'Active Businesses', value: latest.businesses.toLocaleString(),
      change: `+${Math.round(((latest.businesses - prev.businesses) / prev.businesses) * 100)}%`,
      icon: <Building2 size={20} />, positive: true,
    },
    {
      label: 'Receipts This Month', value: latest.receipts.toLocaleString(),
      change: `+${Math.round(((latest.receipts - prev.receipts) / prev.receipts) * 100)}%`,
      icon: <Receipt size={20} />, positive: true,
    },
    {
      label: 'Points Issued', value: `${(latest.points / 1000).toFixed(0)}k`,
      change: `+${Math.round(((latest.points - prev.points) / prev.points) * 100)}%`,
      icon: <DollarSign size={20} />, positive: true,
    },
  ];

  const tooltipStyle = { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 };

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
              <span className={`text-xs font-semibold flex items-center gap-1 ${kpi.positive ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp size={12} /> {kpi.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-100">{kpi.value}</div>
            <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* User growth chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="font-bold text-gray-100 mb-4">Platform Growth</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={PLATFORM_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#E2E8F0' }} />
            <Area type="monotone" dataKey="users" stroke="#22C55E" fill="#22C55E22" strokeWidth={2} name="Users" />
            <Area type="monotone" dataKey="receipts" stroke="#D4AF37" fill="#D4AF3722" strokeWidth={2} name="Receipts" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Economic Impact Dashboard */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-100">Economic Development Dashboard™</h2>
          <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-full font-semibold">
            For Chambers & Cities
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Local Spending', value: '$128,000', sub: 'This Month', color: 'text-green-400' },
            { label: 'Community Spending', value: '$56,000', sub: 'In CRA/Opportunity Zones', color: 'text-yellow-400' },
            { label: 'Jobs Influenced', value: '1,240', sub: 'Through platform businesses', color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-700/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.label === 'Jobs Influenced' ? s.value : s.value}</div>
              <div className="text-sm text-gray-300 font-semibold mt-1">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ECONOMIC_IMPACT} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${(v/1000).toFixed(1)}k`]} labelStyle={{ color: '#E2E8F0' }} />
            <Bar dataKey="local_spend" fill="#1B4332" radius={[4,4,0,0]} name="Local Spend" />
            <Bar dataKey="community_spend" fill="#D4AF37" radius={[4,4,0,0]} name="Community Spend" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* City breakdown */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-gray-100">City Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['City', 'Users', 'Businesses', 'Local Spend', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITY_DATA.map((city, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-6 py-3 font-medium text-gray-200">{city.city}</td>
                  <td className="px-6 py-3 text-gray-300">{city.users.toLocaleString()}</td>
                  <td className="px-6 py-3 text-gray-300">{city.businesses}</td>
                  <td className="px-6 py-3 text-green-400 font-semibold">${city.spend.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      i === 0 ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'
                    }`}>
                      {i === 0 ? 'Primary Market' : 'Expansion'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
