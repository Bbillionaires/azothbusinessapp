'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Receipt } from '@/lib/supabase';
import ReceiptImageViewer from '@/components/receipts/ReceiptImageViewer';
import FraudScoreBadge from '@/components/receipts/FraudScoreBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  User,
  Store,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  Clock,
  BarChart2,
} from 'lucide-react';

interface UserHistory {
  total_receipts: number;
  approved_receipts: number;
  rejected_receipts: number;
  fraud_receipts: number;
  approval_rate: number;
  total_points: number;
  display_name?: string;
  email?: string;
}

type ActionType = 'approve' | 'reject' | 'fraud' | 'resubmit';

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadReceipt() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*, profiles!user_id(display_name, email, tier, points_balance), businesses(name, city, state)')
          .eq('id', params.id as string)
          .single();

        if (!error && data) {
          setReceipt(data as unknown as Receipt);

          // Load user receipt history
          if (data.user_id) {
            const { data: histData } = await supabase
              .from('receipts')
              .select('status, fraud_score')
              .eq('user_id', data.user_id);

            if (histData) {
              const total = histData.length;
              const approved = histData.filter((r: { status: string }) => r.status === 'approved').length;
              const rejected = histData.filter((r: { status: string }) => r.status === 'rejected').length;
              const flagged = histData.filter((r: { status: string; fraud_score: number }) => r.status === 'flagged' || r.fraud_score >= 90).length;
              const profile = (data as unknown as Record<string, unknown>).profiles as { display_name?: string; email?: string; points_balance?: number } | null;
              setUserHistory({
                total_receipts: total,
                approved_receipts: approved,
                rejected_receipts: rejected,
                fraud_receipts: flagged,
                approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
                total_points: profile?.points_balance ?? 0,
                display_name: profile?.display_name ?? undefined,
                email: profile?.email ?? undefined,
              });
            }
          }
        }
      } catch {
        // silently fail — receipt stays null
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function executeAction(type: ActionType) {
    if (!receipt) return;
    setActionLoading(true);

    const statusMap: Record<ActionType, string> = {
      approve: 'approved',
      reject: 'rejected',
      fraud: 'flagged',
      resubmit: 'resubmission_requested',
    };

    try {
      await supabase
        .from('receipts')
        .update({
          status: statusMap[type],
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      setReceipt((r) => r ? { ...r, status: statusMap[type] as Receipt['status'] } : r);
    } finally {
      setActionLoading(false);
      setAction(null);
    }
  }

  const ACTION_CONFIG: Record<ActionType, {
    title: string;
    description: string;
    confirm: string;
    variant: 'default' | 'danger' | 'warning';
  }> = {
    approve: {
      title: 'Approve Receipt?',
      description: `${receipt?.ocr_data?.amount ? Math.floor(receipt.ocr_data.amount * 10) : 0} points will be issued to the user.`,
      confirm: 'Approve & Issue Points',
      variant: 'default',
    },
    reject: {
      title: 'Reject Receipt?',
      description: 'The receipt will be rejected. The user will be notified and no points will be issued.',
      confirm: 'Reject Receipt',
      variant: 'danger',
    },
    fraud: {
      title: 'Flag as Fraud?',
      description: 'This receipt will be flagged as fraudulent. The user\'s fraud score will increase and may trigger an account review.',
      confirm: 'Flag as Fraud',
      variant: 'danger',
    },
    resubmit: {
      title: 'Request Resubmission?',
      description: 'The user will be asked to resubmit a clearer photo of this receipt.',
      confirm: 'Request Resubmission',
      variant: 'warning',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const pointsValue = receipt.ocr_data?.amount ? Math.floor(receipt.ocr_data.amount * 10) : 0;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-100">{receipt.merchant_name}</h1>
            <StatusBadge status={receipt.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {receipt.id}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Left — image (3 cols) */}
        <div className="xl:col-span-2">
          <ReceiptImageViewer imageUrl={receipt.image_url} receiptId={receipt.id} />
        </div>

        {/* Right — details + actions (3 cols) */}
        <div className="xl:col-span-3 space-y-4">

          {/* OCR Data */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-400" />
              OCR Extracted Data
            </h2>
            {receipt.ocr_data ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Store className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Merchant</p>
                      <p className="text-slate-200 font-medium">{receipt.ocr_data.merchant}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-slate-200 font-medium">{receipt.ocr_data.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Subtotal</p>
                      <p className="text-slate-200 font-medium">${receipt.ocr_data.subtotal?.toFixed(2) ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-slate-200 font-bold text-base">${receipt.ocr_data.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Line items */}
                {receipt.ocr_data.items && receipt.ocr_data.items.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-3 mt-3">
                    <p className="text-xs font-medium text-slate-400 mb-2">Line Items</p>
                    <div className="space-y-1.5">
                      {receipt.ocr_data.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="text-slate-400 tabular-nums">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {receipt.ocr_data.tax && (
                        <div className="flex items-center justify-between text-sm border-t border-slate-700/30 pt-1.5">
                          <span className="text-slate-400">Tax</span>
                          <span className="text-slate-400 tabular-nums">${receipt.ocr_data.tax.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Receipt hash */}
                {receipt.receipt_hash && (
                  <div className="flex items-start gap-2 text-xs bg-slate-800/50 rounded-lg p-3 mt-2">
                    <Hash className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500">Receipt Hash</p>
                      <p className="text-slate-400 font-mono break-all">{receipt.receipt_hash}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No OCR data available.</p>
            )}
          </div>

          {/* Fraud Analysis */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Fraud Analysis
            </h2>
            <div className="flex items-start gap-6">
              <FraudScoreBadge score={receipt.fraud_score} />
              <div className="flex-1">
                {receipt.fraud_flags.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400">Active Flags</p>
                    {receipt.fraud_flags.map((flag) => (
                      <div
                        key={flag}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-sm text-red-300 font-medium">
                          {flag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No fraud flags detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* User History */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              User History
              {userHistory?.display_name && (
                <span className="text-xs text-slate-400 font-normal ml-1">— {userHistory.display_name}</span>
              )}
            </h2>
            {userHistory ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Receipts', value: userHistory.total_receipts, color: 'text-slate-200' },
                  { label: 'Approved', value: userHistory.approved_receipts, color: 'text-green-400' },
                  { label: 'Rejected', value: userHistory.rejected_receipts, color: 'text-red-400' },
                  { label: 'Fraud', value: userHistory.fraud_receipts, color: 'text-orange-400' },
                  { label: 'Approval Rate', value: `${userHistory.approval_rate}%`, color: 'text-slate-200' },
                  { label: 'Total Points', value: userHistory.total_points.toLocaleString(), color: 'text-amber-400' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center bg-slate-800/50 rounded-lg p-3">
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No history data available.</p>
            )}
          </div>

          {/* Review Notes */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Review Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes (optional)…"
              rows={3}
              className="admin-input w-full resize-none"
            />
          </div>

          {/* Action buttons */}
          {receipt.status === 'pending' || receipt.status === 'flagged' ? (
            <div className="admin-card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setAction('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve (+{pointsValue} pts)
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-sm font-medium rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setAction('fraud')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-sm font-medium rounded-lg transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Flag as Fraud
                </button>
                <button
                  onClick={() => setAction('resubmit')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-sm font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Request Resubmission
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-card p-4 flex items-center gap-3">
              <BarChart2 className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-400">
                This receipt has been <span className="font-medium text-slate-200">{receipt.status}</span>.{' '}
                {receipt.reviewed_at && (
                  <span>Reviewed {format(new Date(receipt.reviewed_at), 'MMM d, yyyy h:mm a')}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action dialog */}
      {action && (
        <ConfirmDialog
          open
          title={ACTION_CONFIG[action].title}
          description={ACTION_CONFIG[action].description}
          confirmLabel={ACTION_CONFIG[action].confirm}
          variant={ACTION_CONFIG[action].variant}
          loading={actionLoading}
          onConfirm={() => executeAction(action)}
          onCancel={() => setAction(null)}
        />
      )}
    </div>
  );
}
