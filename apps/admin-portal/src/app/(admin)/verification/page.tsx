'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VerificationRequest {
  id: string;
  business_id: string;
  level: 'basic' | 'pro' | 'elite' | 'community_trusted';
  status: 'pending' | 'approved' | 'rejected';
  documents: string[] | null;
  notes: string | null;
  review_notes: string | null;
  created_at: string;
  businesses: {
    name: string;
    owner_id: string;
    profiles: {
      display_name: string | null;
      email: string | null;
    } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LEVEL_COLORS: Record<string, { text: string; bg: string }> = {
  basic: { text: 'text-gray-300', bg: 'bg-slate-600/50' },
  pro: { text: 'text-green-400', bg: 'bg-green-900/40' },
  elite: { text: 'text-yellow-400', bg: 'bg-yellow-900/40' },
  community_trusted: { text: 'text-purple-400', bg: 'bg-purple-900/40' },
};

const LEVEL_LABELS: Record<string, string> = {
  basic: 'Greenwood Basic™',
  pro: 'Greenwood Pro™',
  elite: 'Greenwood Elite™',
  community_trusted: 'Community Trusted™',
};

const REQUIRED_DOCS: Record<string, string[]> = {
  basic: ['Government ID (front + back)', 'Phone verification code', 'Email verification code'],
  pro: ['Business registration certificate', 'Utility bill (last 3 months)', 'Website URL verification', 'Social media profile URLs'],
  elite: ['All Pro documents', 'Professional license(s)', 'Current insurance certificate', 'BBB or equivalent reputation report', 'Operational history documents'],
};

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function VerificationQueuePage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch requests on mount
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('business_verification_requests')
      .select('*, businesses!inner(name, owner_id, profiles!owner_id(display_name, email))')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setRequests(data as VerificationRequest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Reset notes when selection changes
  useEffect(() => {
    setNotes('');
    setActionError(null);
  }, [selected]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const filtered = requests.filter(r =>
    statusFilter === 'All' || r.status === statusFilter.toLowerCase()
  );

  const selectedReq = requests.find(r => r.id === selected) ?? null;

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // ---------------------------------------------------------------------------
  // Actions — calls the existing POST /api/businesses/:id/verify route
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!selectedReq) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/businesses/${selectedReq.business_id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: true,
          verification_level: selectedReq.level,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error ?? 'Failed to approve');
      } else {
        // Optimistically update local state
        setRequests(prev =>
          prev.map(r => r.id === selectedReq.id ? { ...r, status: 'approved' as const } : r)
        );
        setSelected(null);
      }
    } catch {
      setActionError('Network error — please try again');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/businesses/${selectedReq.business_id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: false,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error ?? 'Failed to reject');
      } else {
        setRequests(prev =>
          prev.map(r => r.id === selectedReq.id ? { ...r, status: 'rejected' as const } : r)
        );
        setSelected(null);
      }
    } catch {
      setActionError('Network error — please try again');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Verification Queue</h1>
          <p className="text-gray-400 mt-1">Review and approve Greenwood Check™ verification requests</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
              <div className="h-8 w-12 bg-slate-700 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-slate-700 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-slate-700 rounded" />
                  <div className="h-3 w-32 bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const ownerLabel = (req: VerificationRequest) =>
    req.businesses?.profiles?.display_name ??
    req.businesses?.profiles?.email ??
    req.businesses?.owner_id.slice(0, 8) + '…';

  const submittedLabel = (req: VerificationRequest) =>
    new Date(req.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const docs = selectedReq?.documents ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Verification Queue</h1>
        <p className="text-gray-400 mt-1">Review and approve Greenwood Check™ verification requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: stats.pending, icon: <Clock size={18} className="text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle size={18} className="text-green-400" />, color: 'text-green-400' },
          { label: 'Rejected', value: stats.rejected, icon: <XCircle size={18} className="text-red-400" />, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
            {s.icon}
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center p-10 text-gray-600">
              <div className="text-center">
                <ShieldCheck size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} requests</p>
              </div>
            </div>
          )}
          {filtered.map(req => (
            <button
              key={req.id}
              onClick={() => setSelected(req.id === selected ? null : req.id)}
              className={`w-full text-left bg-slate-800 rounded-xl border p-4 transition-all ${
                selected === req.id ? 'border-green-600' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className={LEVEL_COLORS[req.level]?.text ?? 'text-gray-400'} />
                  <div>
                    <p className="font-semibold text-gray-200">{req.businesses?.name ?? 'Unknown Business'}</p>
                    <p className="text-xs text-gray-500">{ownerLabel(req)} · {submittedLabel(req)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLORS[req.level]?.bg} ${LEVEL_COLORS[req.level]?.text}`}>
                    {LEVEL_LABELS[req.level]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    req.status === 'approved' ? 'bg-green-900/40 text-green-400' :
                    req.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(req.documents?.length ?? 0)} document{(req.documents?.length ?? 0) !== 1 ? 's' : ''} submitted
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selectedReq ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4 h-fit">
            <div>
              <h3 className="font-bold text-gray-100">{selectedReq.businesses?.name ?? 'Unknown Business'}</h3>
              <p className="text-sm text-gray-400">{ownerLabel(selectedReq)} · Applied for {LEVEL_LABELS[selectedReq.level]}</p>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Required Documents</p>
              {(REQUIRED_DOCS[selectedReq.level] ?? []).map((doc, i) => {
                const submitted = docs[i];
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    {submitted
                      ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                      : <XCircle size={14} className="text-gray-600 flex-shrink-0" />}
                    <span className={`text-sm ${submitted ? 'text-gray-300' : 'text-gray-600'}`}>{doc}</span>
                    {submitted && <span className="text-xs text-gray-500 ml-auto">{submitted}</span>}
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Admin Notes</label>
              <textarea
                value={notes || selectedReq.review_notes || selectedReq.notes || ''}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Add notes or feedback for the business..."
                disabled={actionLoading}
              />
            </div>

            {actionError && (
              <div className="rounded-lg p-3 bg-red-900/30 text-red-400 text-sm">{actionError}</div>
            )}

            {selectedReq.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm"
                >
                  {actionLoading ? (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-700/70 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-red-100 rounded-xl font-bold text-sm"
                >
                  {actionLoading ? (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-red-100 border-t-transparent animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject
                </button>
              </div>
            )}

            {selectedReq.status !== 'pending' && (
              <div className={`rounded-lg p-3 text-sm ${selectedReq.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {selectedReq.status === 'approved' ? '✓ This request was approved' : '✗ This request was rejected'}
                {(selectedReq.review_notes || selectedReq.notes) && (
                  <p className="mt-1 text-xs opacity-80">{selectedReq.review_notes ?? selectedReq.notes}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center p-12 text-gray-600">
            <div className="text-center">
              <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a request to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
