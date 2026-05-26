import type { BusinessStatus } from '@/lib/supabase';

const STATUS_CONFIG: Record<BusinessStatus, { label: string; styles: string }> = {
  active: {
    label: 'Active',
    styles: 'bg-green-500/15 text-green-400 border-green-500/25',
  },
  pending: {
    label: 'Pending',
    styles: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  },
  suspended: {
    label: 'Suspended',
    styles: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  rejected: {
    label: 'Rejected',
    styles: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  },
  under_review: {
    label: 'Under Review',
    styles: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
};

interface BusinessStatusBadgeProps {
  status: BusinessStatus;
  className?: string;
}

export default function BusinessStatusBadge({ status, className = '' }: BusinessStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    styles: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.styles} ${className}`}
    >
      {config.label}
    </span>
  );
}
