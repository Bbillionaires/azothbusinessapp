'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsWidgetProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  suffix?: string;
  invertColor?: boolean;
}

export function StatsWidget({
  label,
  value,
  change,
  changeLabel,
  icon,
  loading = false,
  className = '',
  suffix,
  invertColor = false,
}: StatsWidgetProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  const trendColor = isNeutral
    ? 'text-gray-500'
    : invertColor
    ? isPositive
      ? 'text-red-500'
      : 'text-emerald-600'
    : isPositive
    ? 'text-emerald-600'
    : 'text-red-500';

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-card hover:shadow-card-hover transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
            {suffix && <span className="text-base font-medium text-gray-500 ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-gray-400 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="shrink-0 p-2.5 rounded-lg bg-brand-green-50 text-brand-green-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
