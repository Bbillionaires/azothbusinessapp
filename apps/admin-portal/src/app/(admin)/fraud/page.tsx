'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FRAUD_SCORE_DIST = [
  { range: '0-9', count: 842, label: 'Clean' },
  { range: '10-19', count: 234, label: 'Low Risk' },
  { range: '20-29', count: 89, label: 'Review' },
  { range: '30-49', count: 45, label: 'Suspicious' },
  { range: '50-69', count: 22, label: 'High Risk' },
  { range: '70-89', count: 11, label: 'Fraud' },
  { range: '90+', count: 4, label: 'Confirmed' },
];

const MOCK_FRAUD_ALERTS = [
  { id: '1', user: 'Unknown#4821', type: 'duplicate_receipt', score: 95, merchant: 'Greenwood Coffee', amount: 24.50, attempts: 4, time: '2 hours ago' },
  { id: '2', user: 'testuser123', type: 'edited_receipt', score: 82, merchant: 'LaVilla Hair', amount: 150.00, attempts: 1, time: '5 hours ago' },
  { id: '3', user: 'jdoe_2024', type: 'timestamp_mismatch', score: 68, merchant: 'Eastside Fitness', amount: 45.00, attempts: 2, time: '1 day ago' },
  { id: '4', user: 'marcus_j', type: 'rapid_submission', score: 55, merchant: 'Multiple', amount: 340.00, attempts: 8, time: '2 days ago' },
];

const FRAUD_FLAG_TYPES = [
  { flag: 'Duplicate Receipt Hash', count: 23, severity: 'critical' },
  { flag: 'Edited Image Detected', count: 14, severity: 'critical' },
  { flag: 'Timestamp Mismatch', count: 31, severity: 'high' },
  { flag: 'Transaction # Reuse', count: 8, severity: 'critical' },
  { flag: 'Rapid Submissions (>5/hr)', count: 19, severity: 'high' },
  { flag: 'Amount Exceeds Daily Cap', count: 6, severity: 'medium' },
  { flag: 'Unknown Merchant', count: 42, severity: 'low' },
];

const FLAG_COLORS = {
  critical: 'text-red-400 bg-red-900/30',
  high: 'text-orange-400 bg-orange-900/30',
  medium: 'text-yellow-400 bg-yellow-900/30',
  low: 'text-blue-400 bg-blue-900/30',
};

const SCORE_COLORS = (score: number) =>
  score >= 80 ? '#EF4444' : score >= 50 ? '#F97316' : score >= 30 ? '#EAB308' : '#22C55E';

export default function FraudPage() {
  const [timeRange, setTimeRange] = useState('7 days');

  const totalFlagged = FRAUD_SCORE_DIST.filter((_, i) => i >= 2).reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Fraud Detection</h1>
          <p className="text-gray-400 mt-1">Monitor and investigate suspicious activity</p>
        </div>
        <div className="flex gap-2">
          {['24 hours', '7 days', '30 days'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                timeRange === t ? 'bg-red-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alert stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'High Risk Receipts', value: '37', icon: <AlertTriangle size={18} />, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'Flagged Today', value: '12', icon: <ShieldAlert size={18} />, color: 'text-orange-400', bg: 'bg-orange-900/20' },
          { label: 'Fraud Rate', value: '1.8%', icon: <TrendingDown size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
          { label: 'Pending Review', value: '28', icon: <Eye size={18} />, color: 'text-blue-400', bg: 'bg-blue-900/20' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border border-opacity-30 rounded-xl p-4`}
            style={{ borderColor: stat.color.replace('text-', '') }}>
            <div className={`${stat.color} mb-2 flex items-center gap-2`}>
              {stat.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{stat.label}</span>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score distribution */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Fraud Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FRAUD_SCORE_DIST}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Bar dataKey="count" fill="#22C55E" radius={[3,3,0,0]}
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-3 flex-wrap">
            {['Clean', 'Low Risk', 'Review', 'Suspicious', 'High Risk', 'Fraud', 'Confirmed'].map((label, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i < 2 ? '#22C55E' : i < 3 ? '#EAB308' : i < 5 ? '#F97316' : '#EF4444' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Flag types breakdown */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Fraud Flag Types</h2>
          <div className="space-y-3">
            {FRAUD_FLAG_TYPES.sort((a, b) => b.count - a.count).map((flag, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${FLAG_COLORS[flag.severity as keyof typeof FLAG_COLORS]}`}>
                  {flag.severity}
                </span>
                <span className="flex-1 text-sm text-gray-300">{flag.flag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(flag.count / 42) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-400 w-6 text-right">{flag.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active fraud alerts */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-gray-100">Active Fraud Alerts</h2>
          <span className="text-xs bg-red-900/40 text-red-400 px-3 py-1 rounded-full font-semibold">
            {MOCK_FRAUD_ALERTS.length} active
          </span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {MOCK_FRAUD_ALERTS.map(alert => (
            <div key={alert.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-700/30">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: SCORE_COLORS(alert.score) }}
              >
                {alert.score}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">{alert.user}</span>
                  <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {alert.merchant} · ${alert.amount} · {alert.attempts} attempt{alert.attempts > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-xs text-gray-500">{alert.time}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold">Review</button>
                <button className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold">Ban</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
