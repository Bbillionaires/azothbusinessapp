'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Receipt, ReceiptStatus } from '@/lib/supabase';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FraudScoreBadge from '@/components/receipts/FraudScoreBadge';
import ActionMenu from '@/components/ui/ActionMenu';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { format } from 'date-fns';
import {
  Filter,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ChevronDown,
  Loader2,
} from 'lucide-react';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resubmission_requested', label: 'Resubmission Requested' },
];

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [minFraudScore, setMinFraudScore] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchReceipts() {
      setFetchLoading(true);
      let query = supabase
        .from('receipts')
        .select('id, user_id, business_id, amount, merchant_name, receipt_date, submitted_at, status, fraud_score, fraud_flags, image_url, profiles!user_id(full_name, email)')
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        setReceipts(data as unknown as Receipt[]);
      }
      setFetchLoading(false);
    }
    fetchReceipts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Client-side filter for search and fraud score
  const filteredReceipts = receipts.filter((r) => {
    if (minFraudScore && r.fraud_score < parseInt(minFraudScore)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.merchant_name.toLowerCase().includes(q) && !r.user_id.includes(q)) return false;
    }
    return true;
  });

  async function executeBulkAction(action: 'approve' | 'reject') {
    setLoading(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    try {
      await supabase
        .from('receipts')
        .update({ status: newStatus })
        .in('id', selectedIds);
      // Optimistic update
      setReceipts(prev => prev.map(r =>
        selectedIds.includes(r.id) ? { ...r, status: newStatus as ReceiptStatus } : r
      ));
      setSelectedIds([]);
    } finally {
      setLoading(false);
      setBulkAction(null);
    }
  }

  const columns: Column<Receipt>[] = [
    {
      key: 'user_id',
      header: 'User',
      sortable: true,
      render: (r) => (
        <span className="text-xs font-mono text-slate-400">{r.user_id.slice(0, 12)}…</span>
      ),
    },
    {
      key: 'merchant_name',
      header: 'Merchant',
      sortable: true,
      render: (r) => <span className="font-medium text-slate-200">{r.merchant_name}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (r) => (
        <span className="tabular-nums font-medium text-slate-200">${r.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      sortable: true,
      render: (r) => (
        <span className="text-slate-400 text-xs">
          {format(new Date(r.submitted_at), 'MMM d, yyyy h:mm a')}
        </span>
      ),
    },
    {
      key: 'fraud_score',
      header: 'Fraud Score',
      sortable: true,
      render: (r) => <FraudScoreBadge score={r.fraud_score} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <ActionMenu
          align="right"
          items={[
            {
              label: 'Review Detail',
              onClick: () => router.push(`/receipts/${r.id}`),
            },
            {
              label: 'Approve',
              icon: CheckCircle,
              onClick: async () => {
                setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved' as ReceiptStatus } : x));
                await supabase.from('receipts').update({ status: 'approved' }).eq('id', r.id);
              },
              disabled: r.status === 'approved',
            },
            {
              label: 'Reject',
              icon: XCircle,
              variant: 'danger',
              onClick: async () => {
                setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' as ReceiptStatus } : x));
                await supabase.from('receipts').update({ status: 'rejected' }).eq('id', r.id);
              },
              disabled: r.status === 'rejected',
            },
            {
              label: 'Request Resubmit',
              icon: RefreshCw,
              variant: 'warning',
              onClick: async () => {
                setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'resubmission_requested' as ReceiptStatus } : x));
                await supabase.from('receipts').update({ status: 'resubmission_requested' }).eq('id', r.id);
              },
            },
          ]}
        />
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search merchant or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input pl-8 pr-8 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Min fraud score */}
        <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Min Fraud Score:</span>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={minFraudScore}
            onChange={(e) => setMinFraudScore(e.target.value)}
            className="bg-transparent text-sm text-slate-300 focus:outline-none w-12 text-center"
          />
        </div>

        <div className="flex-1" />

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <span className="text-xs text-green-400 font-medium">{selectedIds.length} selected</span>
            <button
              onClick={() => setBulkAction('approve')}
              className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded transition-colors"
            >
              Approve All
            </button>
            <button
              onClick={() => setBulkAction('reject')}
              className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        <button
          onClick={() => window.location.href = '/api/exports/receipts'}
          className="admin-btn-secondary flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{filteredReceipts.length.toLocaleString()} receipts</span>
        <span>·</span>
        <span className="text-yellow-400">{filteredReceipts.filter((r) => r.status === 'pending').length} pending</span>
        <span>·</span>
        <span className="text-red-400">{filteredReceipts.filter((r) => r.fraud_score >= 70).length} high risk</span>
      </div>

      {/* Table */}
      {fetchLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading receipts...</span>
        </div>
      ) : (
        <DataTable
          data={filteredReceipts}
          columns={columns}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(r) => router.push(`/receipts/${r.id}`)}
          emptyMessage="No receipts match the current filters."
        />
      )}

      {/* Bulk action dialog */}
      <ConfirmDialog
        open={bulkAction !== null}
        title={bulkAction === 'approve' ? `Approve ${selectedIds.length} receipts?` : `Reject ${selectedIds.length} receipts?`}
        description={
          bulkAction === 'approve'
            ? 'Points will be issued for all selected receipts. This action cannot be undone.'
            : 'All selected receipts will be rejected. Users will be notified.'
        }
        confirmLabel={bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
        variant={bulkAction === 'reject' ? 'danger' : 'default'}
        loading={loading}
        onConfirm={() => bulkAction && executeBulkAction(bulkAction)}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
