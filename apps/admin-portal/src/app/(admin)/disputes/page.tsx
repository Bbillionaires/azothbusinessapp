'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface Dispute {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  receipt_id?: string;
  review_id?: string;
  business_id?: string;
  assigned_to?: string;
  resolution_note?: string;
  resolved_at?: string;
  profiles?: { full_name?: string; email?: string } | null;
  receipts?: { merchant_name?: string; amount?: number } | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-400',
  high: 'bg-orange-900/40 text-orange-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-slate-600 text-gray-300',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-400',
  investigating: 'bg-yellow-900/40 text-yellow-400',
  resolved: 'bg-green-900/40 text-green-400',
  closed: 'bg-slate-700 text-gray-500',
};

const TYPE_ICONS: Record<string, string> = {
  receipt: '🧾',
  review: '⭐',
  fraud: '🚨',
  points: '💰',
  account: '👤',
  other: '❓',
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('disputes')
      .select('*, profiles!user_id(full_name, email), receipts(merchant_name, amount)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setDisputes(data as Dispute[]);
    }
    setLoading(false);
  }

  async function updateDisputeStatus(id: string, status: string, resolutionNote?: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_note: resolutionNote }),
      });
      if (res.ok) {
        setDisputes(prev =>
          prev.map(d => d.id === id ? { ...d, status, resolution_note: resolutionNote } : d)
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = disputes.filter(d =>
    statusFilter === 'All' || d.status === statusFilter.toLowerCase()
  );

  const selected = disputes.find(d => d.id === selectedDispute);

  const stats = {
    open: disputes.filter(d => d.status === 'open').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    critical: disputes.filter(d => d.priority === 'critical').length,
  };

  const getUserLabel = (d: Dispute) => d.profiles?.full_name ?? d.profiles?.email ?? 'Unknown User';
  const getCreatedLabel = (d: Dispute) => d.created_at ? new Date(d.created_at).toLocaleDateString() : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Disputes</h1>
        <p className="text-gray-400 mt-1">Review and resolve user and business disputes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-blue-400' },
          { label: 'Investigating', value: stats.investigating, color: 'text-yellow-400' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['All', 'Open', 'Investigating', 'Resolved', 'Closed'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusFilter === f ? 'bg-green-700 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-green-500" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Dispute list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-gray-500">
                No disputes found
              </div>
            ) : (
              filtered.map(dispute => (
                <button
                  key={dispute.id}
                  onClick={() => setSelectedDispute(dispute.id === selectedDispute ? null : dispute.id)}
                  className={`w-full text-left bg-slate-800 rounded-xl border p-4 transition-all ${
                    selectedDispute === dispute.id ? 'border-green-600' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TYPE_ICONS[dispute.type] ?? '❓'}</span>
                      <div>
                        <p className="font-semibold text-gray-200 text-sm">{dispute.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{getUserLabel(dispute)} · {getCreatedLabel(dispute)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[dispute.priority] ?? 'bg-slate-600 text-gray-300'}`}>
                        {dispute.priority}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[dispute.status] ?? 'bg-slate-700 text-gray-500'}`}>
                        {dispute.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{dispute.description}</p>
                </button>
              ))
            )}
          </div>

          {/* Dispute detail */}
          {selected ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 h-fit">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-100">{selected.subject}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{getUserLabel(selected)} · {getCreatedLabel(selected)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLES[selected.status] ?? 'bg-slate-700 text-gray-500'}`}>
                  {selected.status}
                </span>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
              </div>

              {selected.receipts && (
                <div className="bg-slate-700/30 rounded-lg px-4 py-2 mb-4 text-xs text-gray-400">
                  Receipt: {selected.receipts.merchant_name}
                  {selected.receipts.amount !== undefined ? ` · $${selected.receipts.amount.toFixed(2)}` : ''}
                </div>
              )}

              {selected.resolution_note && (
                <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-green-400 mb-1">Resolution Note</p>
                  <p className="text-sm text-gray-300">{selected.resolution_note}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  disabled={actionLoading || selected.status === 'resolved'}
                  onClick={() => updateDisputeStatus(selected.id, 'resolved', replyText || undefined)}
                  className="flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                >
                  <CheckCircle size={14} /> Resolve
                </button>
                <button
                  disabled={actionLoading || selected.status === 'investigating'}
                  onClick={() => updateDisputeStatus(selected.id, 'investigating')}
                  className="flex items-center gap-1 px-3 py-2 bg-yellow-700/50 hover:bg-yellow-700 disabled:opacity-50 text-yellow-300 rounded-lg text-xs font-semibold"
                >
                  <AlertCircle size={14} /> Investigate
                </button>
                <button
                  disabled={actionLoading || selected.status === 'closed'}
                  onClick={() => updateDisputeStatus(selected.id, 'closed')}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-gray-200 rounded-lg text-xs font-semibold"
                >
                  <XCircle size={14} /> Close
                </button>
              </div>

              {/* Reply / resolution note */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Resolution Note / Reply to User</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Type your response..."
                />
                <button
                  disabled={actionLoading || !replyText.trim()}
                  onClick={() => updateDisputeStatus(selected.id, 'resolved', replyText)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold"
                >
                  <MessageSquare size={14} /> Send Reply &amp; Resolve
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center p-12 text-gray-600">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a dispute to review</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
