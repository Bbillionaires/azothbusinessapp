interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  // Receipt statuses
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  approved: 'bg-green-500/15 text-green-400 border-green-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  flagged: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  resubmission_requested: 'bg-blue-500/15 text-blue-400 border-blue-500/25',

  // Business statuses
  active: 'bg-green-500/15 text-green-400 border-green-500/25',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/25',
  under_review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',

  // Dispute statuses
  open: 'bg-red-500/15 text-red-400 border-red-500/25',
  in_review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  resolved: 'bg-green-500/15 text-green-400 border-green-500/25',
  dismissed: 'bg-slate-500/15 text-slate-400 border-slate-500/25',

  // Fraud alert statuses
  new: 'bg-red-500/15 text-red-400 border-red-500/25',
  investigating: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  confirmed: 'bg-red-500/20 text-red-300 border-red-500/30',
  false_positive: 'bg-slate-500/15 text-slate-400 border-slate-500/25',

  // Generic
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  enabled: 'bg-green-500/15 text-green-400 border-green-500/25',
  disabled: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const STATUS_LABELS: Record<string, string> = {
  resubmission_requested: 'Resubmit',
  under_review: 'Under Review',
  in_review: 'In Review',
  false_positive: 'False Positive',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25';
  const label = STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles} ${className}`}>
      {label}
    </span>
  );
}
