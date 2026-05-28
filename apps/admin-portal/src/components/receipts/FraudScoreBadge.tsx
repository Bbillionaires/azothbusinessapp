interface FraudScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

interface FraudLevel {
  label: string;
  color: string;
  bg: string;
  border: string;
  barColor: string;
}

// score is stored as 0.0–1.0 in DB; display as 0–100 percentage
export function getFraudLevel(score: number): FraudLevel {
  if (score < 0.20) {
    return {
      label: 'Low Risk',
      color: 'text-green-400',
      bg: 'bg-green-500/15',
      border: 'border-green-500/25',
      barColor: 'bg-green-500',
    };
  }
  if (score < 0.50) {
    return {
      label: 'Review',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/15',
      border: 'border-yellow-500/25',
      barColor: 'bg-yellow-500',
    };
  }
  if (score < 0.80) {
    return {
      label: 'Suspicious',
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/25',
      barColor: 'bg-orange-500',
    };
  }
  return {
    label: 'High Risk',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/25',
    barColor: 'bg-red-500',
  };
}

export default function FraudScoreBadge({ score, showLabel = true, size = 'md' }: FraudScoreBadgeProps) {
  const level = getFraudLevel(score);
  const clampedScore = Math.round(Math.max(0, Math.min(1, score)) * 100);

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${level.bg} ${level.border} ${level.color}`}
      >
        <span className="tabular-nums">{clampedScore}</span>
        {showLabel && <span className="opacity-80">{level.label}</span>}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-1.5 px-3 py-2 rounded-lg border ${level.bg} ${level.border}`}>
      <div className="flex items-center justify-between gap-4">
        <span className={`text-sm font-bold tabular-nums ${level.color}`}>{clampedScore}</span>
        {showLabel && (
          <span className={`text-xs font-semibold ${level.color}`}>{level.label}</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${level.barColor}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}
