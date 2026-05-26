'use client';

import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Users, Star, DollarSign } from 'lucide-react';

const PERIOD_OPTIONS = ['7 days', '30 days', '90 days', '12 months'];

const PROFILE_VIEWS = [
  { date: 'May 1', views: 45 }, { date: 'May 5', views: 62 }, { date: 'May 8', views: 58 },
  { date: 'May 12', views: 89 }, { date: 'May 15', views: 105 }, { date: 'May 18', views: 94 },
  { date: 'May 22', views: 118 }, { date: 'May 26', views: 132 },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 4200 }, { month: 'Feb', revenue: 5100 }, { month: 'Mar', revenue: 4800 },
  { month: 'Apr', revenue: 6200 }, { month: 'May', revenue: 5900 },
];

const VISITOR_SOURCES = [
  { name: 'Search', value: 42, color: '#1B4332' },
  { name: 'Map', value: 28, color: '#D4AF37' },
  { name: 'Direct', value: 18, color: '#059669' },
  { name: 'Referral', value: 12, color: '#7C3AED' },
];

const TOP_ACTIONS = [
  { action: 'Viewed Photos', count: 342, change: 12 },
  { action: 'Clicked Call', count: 89, change: -5 },
  { action: 'Get Directions', count: 124, change: 8 },
  { action: 'Visited Website', count: 67, change: 22 },
  { action: 'Saved Business', count: 48, change: 31 },
  { action: 'Left Review', count: 12, change: -2 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30 days');

  const kpis = [
    { label: 'Profile Views', value: '1,247', change: 18, icon: <Eye size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'New Followers', value: '34', change: 12, icon: <Users size={20} className="text-green-600" />, bg: 'bg-green-50' },
    { label: 'Avg Rating', value: '4.7', change: 3, icon: <Star size={20} className="text-yellow-600" />, bg: 'bg-yellow-50' },
    { label: 'Referral Revenue', value: '$340', change: -8, icon: <DollarSign size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{kpi.label}</div>
            <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {kpi.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(kpi.change)}% vs prev period
            </div>
          </div>
        ))}
      </div>

      {/* Profile views chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Profile Views</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={PROFILE_VIEWS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#1B4332" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Estimated Revenue Influenced</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#1B4332" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor sources */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Traffic Sources</h2>
          <div className="flex items-center gap-6">
            <PieChart width={140} height={140}>
              <Pie data={VISITOR_SOURCES} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {VISITOR_SOURCES.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {VISITOR_SOURCES.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-700">{s.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Customer Actions</h2>
        <div className="space-y-3">
          {TOP_ACTIONS.map((action, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-36 text-sm text-gray-700 flex-shrink-0">{action.action}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-700 rounded-full"
                  style={{ width: `${(action.count / 342) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-semibold text-gray-900">{action.count}</span>
              <span className={`w-12 text-right text-xs font-semibold ${action.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {action.change >= 0 ? '+' : ''}{action.change}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
