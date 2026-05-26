'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  subValue?: string;
  loading?: boolean;
  accentColor?: 'green' | 'gold' | 'blue' | 'purple' | 'rose';
}

const accentMap = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  gold: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100' },
};

export function StatsCard({
  icon,
  label,
  value,
  change,
  changePeriod = 'vs last month',
  subValue,
  loading = false,
  accentColor = 'green',
}: StatsCardProps) {
  const accent = accentMap[accentColor];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
        <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse mb-4" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${accent.iconBg} ${accent.text} flex items-center justify-center mb-4`}>
        {icon}
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-gray-500">{label}</p>

      {/* Value */}
      <p className="mt-1 text-3xl font-bold text-gray-900 tracking-tight">{value}</p>

      {/* Sub value */}
      {subValue && (
        <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>
      )}

      {/* Trend */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <div
            className={[
              'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              isPositive
                ? 'bg-emerald-100 text-emerald-700'
                : isNegative
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-500',
            ].join(' ')}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
          <span className="text-xs text-gray-400">{changePeriod}</span>
        </div>
      )}
    </div>
  );
}
