import Link from 'next/link';
import { format } from 'date-fns';
import type { Receipt } from '@/lib/supabase';
import StatusBadge from '@/components/ui/StatusBadge';
import FraudScoreBadge from './FraudScoreBadge';
import { ExternalLink, User, Store, Calendar, DollarSign } from 'lucide-react';

interface ReceiptReviewCardProps {
  receipt: Receipt;
}

export default function ReceiptReviewCard({ receipt }: ReceiptReviewCardProps) {
  return (
    <div className="admin-card p-4 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={receipt.status} />
            <FraudScoreBadge score={receipt.fraud_score} size="sm" />
            {receipt.fraud_flags.length > 0 && (
              <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                {receipt.fraud_flags.length} flag{receipt.fraud_flags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-slate-200">{receipt.merchant_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-200 font-medium">
                ${receipt.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{receipt.user_id.slice(0, 8)}…</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{format(new Date(receipt.submitted_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Fraud flags */}
          {receipt.fraud_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {receipt.fraud_flags.map((flag) => (
                <span
                  key={flag}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded"
                >
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        <Link
          href={`/receipts/${receipt.id}`}
          className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium transition-colors shrink-0"
        >
          Review
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
