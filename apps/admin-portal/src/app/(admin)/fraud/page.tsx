'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown, Eye, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createBrowserClient } from '@supabase/ssr';

interface FraudReceipt {
  id: string;
  user_id: string;
  business_id?: string;
  merchant_name?: string;
  amount?: number;
  fraud_score: number;
  status: string;
  submitted_at?: string;
  fraud_flags?: Record<string, unknown> | string[] | null;
  image_url?: string;
  profiles?: { display_name?: string; email?: string } | null;
  businesses?: { name?: string } | null;
}

const FRAUD_FLAG_LABELS: Record<string, { label: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = {
  duplicate_hash: { label: 'Duplicate Receipt Hash', severity: 'critical' },
  duplicate_transaction: { label: 'Transaction # Reuse', severity: 'critical' },
  excessive_daily: { label: 'Rapid Submissions (>10/day)', severity: 'high' },
  amount_cap: { label: 'Amount Exceeds Cap', severity: 'medium' },
  ocr_anomaly: { label: 'Edited Image Detected', severity: 'critical' },
  future_dated: { label: 'Future-Dated Receipt', severity: 'high' },
  stale_receipt: { label: 'Stale Receipt (>30 days)', severity: 'medium' },
  new_account: { label: 'New Account Rapid Submission', severity: 'high' },
  monthly_cap: { label: 'Monthly Spending Cap Exceeded', severity: 'medium' },
};

const FLAG_COLORS = {
  critical: 'text-red-400 bg-red-900/30',
  high: 'text-orange-400 bg-orange-900/30',
  medium: 'text-yellow-400 bg-yellow-900/30',
  low: 'text-blue-400 bg-blue-900/30',
};

const SCORE_COLORS = (score: number) =>
  score >= 80 ? '#EF4444' : score >= 50 ? '#F97316' : score >= 30 ? '#EAB308' : '#22C55E';

function getFlagKeys(fraud_flags: FraudReceipt['fraud_flags']): string[] {
  if (!fraud_flags) return [];
  if (Array.isArray(fraud_flags)) return fraud_flags as string[];
  if (typeof fraud_flags === 'object') return Object.keys(fraud_flags).filter(k => (fraud_flags as Record<string, unknown>)[k]);
  return [];
}

function buildScoreDistribution(receipts: FraudReceipt[]) {
  const buckets = [
    { range: '0-9', count: 0, label: 'Clean' },
    { range: '10-19', count: 0, label: 'Low Risk' },
    { range: '20-29', count: 0, label: 'Review' },
    { range: '30-49', count: 0, label: 'Suspicious' },
    { range: '50-69', count: 0, label: 'High Risk' },
    { range: '70-89', count: 0, label: 'Fraud' },
    { range: '90+', count: 0, label: 'Confirmed' },
  ];
  receipts.forEach(r => {
    const s = r.fraud_score;
    if (s < 10) buckets[0].count++;
    else if (s < 20) buckets[1].count++;
    else if (s < 30) buckets[2].count++;
    else if (s < 50) buckets[3].count++;
    else if (s < 70) buckets[4].count++;
    else if (s < 90) buckets[5].count++;
    else buckets[6].count++;
  });
  return buckets;
}

function buildFlagCounts(receipts: FraudReceipt[]) {
  const counts: Record<string, number> = {};
  receipts.forEach(r => {
    getFlagKeys(r.fraud_flags).forEach(key => {
      counts[key] = (counts[key] ?? 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([flag, count]) => ({
      flag: FRAUD_FLAG_LABELS[flag]?.label ?? flag.replace(/_/g, ' '),
      count,
      severity: FRAUD_FLAG_LABELS[flag]?.severity ?? 'low',
    }))
    .sort((a, b) => b.count - a.count);
}

export default function FraudPage() {
  const [receipts, setReceipts] = useState<FraudReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7 days');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchFraudReceipts();
  }, [timeRange]);

  async function fetchFraudReceipts() {
    setLoading(true);
    let query = supabase
      .from('receipts')
      .select('*, profiles!user_id(display_name, email), businesses(name)')
      .gte('fraud_score', 30)
      .order('fraud_score', { ascending: false })
      .limit(50);

    // Filter by time range
    const now = new Date();
    if (timeRange === '24 hours') {
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('submitted_at', since);
    } else if (timeRange === '7 days') {
      const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('submitted_at', since);
    } else if (timeRange === '30 days') {
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('submitted_at', since);
    }

    const { data, error } = await query;
    if (!error && data) {
      setReceipts(data as FraudReceipt[]);
    }
    setLoading(false);
  }

  const scoreDistribution = buildScoreDistribution(receipts);
  const flagCounts = buildFlagCounts(receipts);
  const maxFlagCount = Math.max(...flagCounts.map(f => f.count), 1);

  const highRisk = receipts.filter(r => r.fraud_score >= 70).length;
  const flaggedToday = receipts.filter(r => {
    if (!r.submitted_at) return false;
    const d = new Date(r.submitted_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const pendingReview = receipts.filter(r => r.status === 'pending' || r.status === 'flagged').length;
  const totalAll = receipts.length;
  const fraudRate = totalAll > 0 ? ((highRisk / totalAll) * 100).toFixed(1) + '%' : '—';

  const getUserLabel = (r: FraudReceipt) => r.profiles?.display_name ?? r.profiles?.email ?? `#${r.user_id?.slice(0, 6) ?? '?'}`;
  const getMerchant = (r: FraudReceipt) => r.businesses?.name ?? r.merchant_name ?? 'Unknown';

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
          { label: 'High Risk Receipts', value: loading ? '—' : String(highRisk), icon: <AlertTriangle size={18} />, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'Flagged Today', value: loading ? '—' : String(flaggedToday), icon: <ShieldAlert size={18} />, color: 'text-orange-400', bg: 'bg-orange-900/20' },
          { label: 'Fraud Rate', value: loading ? '—' : fraudRate, icon: <TrendingDown size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
          { label: 'Pending Review', value: loading ? '—' : String(pendingReview), icon: <Eye size={18} />, color: 'text-blue-400', bg: 'bg-blue-900/20' },
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-red-500" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score distribution */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h2 className="font-bold text-gray-100 mb-4">Fraud Score Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#E2E8F0' }}
                  />
                  <Bar dataKey="count" fill="#22C55E" radius={[3, 3, 0, 0]} />
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
              {flagCounts.length === 0 ? (
                <p className="text-gray-500 text-sm">No fraud flags detected in this period</p>
              ) : (
                <div className="space-y-3">
                  {flagCounts.map((flag, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${FLAG_COLORS[flag.severity as keyof typeof FLAG_COLORS]}`}>
                        {flag.severity}
                      </span>
                      <span className="flex-1 text-sm text-gray-300">{flag.flag}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${(flag.count / maxFlagCount) * 100}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 w-6 text-right">{flag.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active fraud alerts */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-100">Active Fraud Alerts</h2>
              <span className="text-xs bg-red-900/40 text-red-400 px-3 py-1 rounded-full font-semibold">
                {receipts.length} flagged
              </span>
            </div>
            {receipts.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No fraud alerts in this time range</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {receipts.map(receipt => {
                  const flags = getFlagKeys(receipt.fraud_flags);
                  const primaryFlag = flags[0] ?? 'suspicious';
                  return (
                    <div key={receipt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-700/30">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: SCORE_COLORS(receipt.fraud_score) }}
                      >
                        {receipt.fraud_score}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-200">{getUserLabel(receipt)}</span>
                          <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                            {(FRAUD_FLAG_LABELS[primaryFlag]?.label ?? primaryFlag).toLowerCase().replace(/ /g, '_')}
                          </span>
                          {flags.length > 1 && (
                            <span className="text-xs bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full">
                              +{flags.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">
                          {getMerchant(receipt)}
                          {receipt.amount !== undefined ? ` · $${Number(receipt.amount).toFixed(2)}` : ''}
                          {receipt.submitted_at ? ` · ${new Date(receipt.submitted_at).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold">Review</button>
                        <button className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold">Ban</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
