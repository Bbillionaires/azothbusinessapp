'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAdminAuth } from '@/components/layout/RoleGuard';
import { canApproveVerification } from '@/lib/permissions';
import type { AdminRole, BusinessStatus } from '@/lib/supabase';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { CheckCircle, XCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';

interface VerificationActionsProps {
  businessId: string;
  businessName: string;
  currentStatus: BusinessStatus;
  onStatusChange?: (newStatus: BusinessStatus) => void;
}

export default function VerificationActions({
  businessId,
  businessName,
  currentStatus,
  onStatusChange,
}: VerificationActionsProps) {
  const { role } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'suspend' | 'review' | null;
  }>({ open: false, action: null });

  const supabase = createSupabaseBrowserClient();

  if (!role || !canApproveVerification(role as AdminRole)) {
    return null;
  }

  async function executeAction(action: string) {
    setLoading(true);
    const statusMap: Record<string, BusinessStatus> = {
      approve: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      review: 'under_review',
    };
    const newStatus = statusMap[action];

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (!error) {
        onStatusChange?.(newStatus);
      }
    } finally {
      setLoading(false);
      setDialog({ open: false, action: null });
    }
  }

  const ACTION_CONFIG = {
    approve: {
      label: 'Approve',
      icon: CheckCircle,
      className: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20',
      dialogTitle: `Approve ${businessName}?`,
      dialogDesc: 'This business will be approved and listed as active on the platform.',
      variant: 'default' as const,
    },
    reject: {
      label: 'Reject',
      icon: XCircle,
      className: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
      dialogTitle: `Reject ${businessName}?`,
      dialogDesc: 'This business will be rejected and the owner will be notified.',
      variant: 'danger' as const,
    },
    suspend: {
      label: 'Suspend',
      icon: AlertCircle,
      className: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20',
      dialogTitle: `Suspend ${businessName}?`,
      dialogDesc: 'This business will be suspended. All reward earning will be paused.',
      variant: 'warning' as const,
    },
    review: {
      label: 'Flag for Review',
      icon: Eye,
      className: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20',
      dialogTitle: `Flag ${businessName} for Review?`,
      dialogDesc: 'This business will be marked as under review.',
      variant: 'default' as const,
    },
  };

  // Show actions relevant to current status
  const visibleActions: Array<'approve' | 'reject' | 'suspend' | 'review'> = [];
  if (currentStatus === 'pending') visibleActions.push('approve', 'reject', 'review');
  if (currentStatus === 'active') visibleActions.push('suspend', 'review');
  if (currentStatus === 'under_review') visibleActions.push('approve', 'reject', 'suspend');
  if (currentStatus === 'suspended') visibleActions.push('approve', 'review');

  const activeAction = dialog.action ? ACTION_CONFIG[dialog.action] : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
        {visibleActions.map((action) => {
          const config = ACTION_CONFIG[action];
          const Icon = config.icon;
          return (
            <button
              key={action}
              onClick={() => setDialog({ open: true, action })}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${config.className}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>

      {activeAction && (
        <ConfirmDialog
          open={dialog.open}
          title={activeAction.dialogTitle}
          description={activeAction.dialogDesc}
          confirmLabel={activeAction.label}
          variant={activeAction.variant}
          loading={loading}
          onConfirm={() => dialog.action && executeAction(dialog.action)}
          onCancel={() => setDialog({ open: false, action: null })}
        />
      )}
    </>
  );
}
