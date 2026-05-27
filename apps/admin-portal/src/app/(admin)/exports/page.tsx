'use client';

import { useState } from 'react';
import { Download, FileText, Users, Store, Receipt, BarChart2, ShieldAlert, CheckCircle, XCircle, Clock, Coins } from 'lucide-react';
import { RoleGuard } from '../../../components/layout/RoleGuard';

type ExportType = 'users' | 'businesses' | 'receipts' | 'analytics' | 'transactions';

interface ExportConfig {
  type: ExportType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  filename: string;
  fields: string[];
}

const EXPORTS: ExportConfig[] = [
  {
    type: 'users',
    label: 'Users',
    description: 'All registered profiles including tier, points balance, role, and join date.',
    icon: Users,
    color: 'text-blue-400',
    filename: 'local-first-rewards-users.csv',
    fields: ['id', 'email', 'full_name', 'role', 'tier', 'points_balance', 'city', 'created_at', 'last_seen_at'],
  },
  {
    type: 'businesses',
    label: 'Businesses',
    description: 'All business listings with verification level, status, category, and location.',
    icon: Store,
    color: 'text-green-400',
    filename: 'local-first-rewards-businesses.csv',
    fields: ['id', 'name', 'category', 'city', 'status', 'verification_level', 'owner_id', 'created_at'],
  },
  {
    type: 'receipts',
    label: 'Receipts',
    description: 'All submitted receipts with OCR data, fraud scores, approval status, and points awarded.',
    icon: Receipt,
    color: 'text-yellow-400',
    filename: 'local-first-rewards-receipts.csv',
    fields: ['id', 'user_id', 'business_id', 'merchant_name', 'total', 'receipt_date', 'status', 'fraud_score', 'points_awarded', 'created_at'],
  },
  {
    type: 'analytics',
    label: 'Analytics',
    description: 'Aggregated daily analytics: leaderboard entries, impact scores, and spending by city.',
    icon: BarChart2,
    color: 'text-purple-400',
    filename: 'local-first-rewards-analytics.csv',
    fields: ['user_id', 'city', 'state', 'period', 'category', 'rank', 'score', 'created_at'],
  },
  {
    type: 'transactions',
    label: 'Transactions',
    description: 'Full immutable points transaction ledger with types, amounts, and reference IDs.',
    icon: Coins,
    color: 'text-orange-400',
    filename: 'local-first-rewards-transactions.csv',
    fields: ['id', 'user_id', 'amount', 'type', 'description', 'reference_id', 'reference_type', 'created_at'],
  },
];

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ExportsPage() {
  const [statuses, setStatuses] = useState<Record<ExportType, ExportStatus>>({
    users: 'idle',
    businesses: 'idle',
    receipts: 'idle',
    analytics: 'idle',
    transactions: 'idle',
  });
  const [errors, setErrors] = useState<Record<ExportType, string | null>>({
    users: null,
    businesses: null,
    receipts: null,
    analytics: null,
    transactions: null,
  });

  async function handleExport(config: ExportConfig) {
    setStatuses((s) => ({ ...s, [config.type]: 'loading' }));
    setErrors((e) => ({ ...e, [config.type]: null }));

    try {
      const res = await fetch(`/api/exports/${config.type}`, { method: 'GET' });

      if (!res.ok) {
        let message = `Export failed (HTTP ${res.status})`;
        try {
          const data = await res.json();
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        setStatuses((s) => ({ ...s, [config.type]: 'error' }));
        setErrors((e) => ({ ...e, [config.type]: message }));
        return;
      }

      // Trigger browser download from the response blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = config.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatuses((s) => ({ ...s, [config.type]: 'success' }));
      // Reset to idle after 3 seconds
      setTimeout(() => setStatuses((s) => ({ ...s, [config.type]: 'idle' })), 3000);
    } catch {
      setStatuses((s) => ({ ...s, [config.type]: 'error' }));
      setErrors((e) => ({ ...e, [config.type]: 'Network error — please try again.' }));
    }
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="space-y-6 max-w-4xl">
        {/* Page header */}
        <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Super Admin Only</p>
            <p className="text-xs text-slate-400 mt-0.5">
              All exported files contain personally identifiable information. Handle with care and
              follow your data handling policy. Downloads are logged in the audit trail.
            </p>
          </div>
        </div>

        {/* Export cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPORTS.map((config) => {
            const Icon = config.icon;
            const status = statuses[config.type];
            const error = errors[config.type];
            const isLoading = status === 'loading';
            const isSuccess = status === 'success';
            const isError = status === 'error';

            return (
              <div
                key={config.type}
                className="bg-[#1E293B] border border-slate-700 rounded-xl p-5 flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200">{config.label} Export</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                  </div>
                </div>

                {/* Fields list */}
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide font-medium">
                    Included columns
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.fields.map((f) => (
                      <span
                        key={f}
                        className="px-1.5 py-0.5 bg-[#0F172A] border border-slate-700 rounded text-xs text-slate-400 font-mono"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Output filename */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-mono">{config.filename}</span>
                </div>

                {/* Error banner */}
                {isError && error && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Download button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleExport(config)}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isSuccess
                      ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                      : isError
                      ? 'bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Generating CSV…
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download {config.label} CSV
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Note about large exports */}
        <p className="text-xs text-slate-600 text-center">
          Large exports may take several seconds to generate. All exports include all records with no
          date filter. For filtered exports, use the table views above.
        </p>
      </div>
    </RoleGuard>
  );
}
