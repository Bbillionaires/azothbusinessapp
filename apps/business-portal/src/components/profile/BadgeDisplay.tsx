'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface BadgeDisplayProps {
  tier: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; iconColor: string }
> = {
  basic: {
    label: 'Greenwood Basic™',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  pro: {
    label: 'Greenwood Pro™',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  elite: {
    label: 'Greenwood Elite™',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
  community: {
    label: 'Greenwood Community Trusted™',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
};

const sizeMap = {
  sm: { wrapper: 'px-2.5 py-1 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
  md: { wrapper: 'px-3.5 py-1.5 text-sm gap-2', icon: 'h-4 w-4' },
  lg: { wrapper: 'px-4 py-2 text-base gap-2.5', icon: 'h-5 w-5' },
};

export function BadgeDisplay({ tier, size = 'md' }: BadgeDisplayProps) {
  const sz = sizeMap[size];

  if (!tier) {
    return (
      <div
        className={`inline-flex items-center ${sz.wrapper} rounded-full border border-gray-200 bg-gray-50 text-gray-500`}
      >
        <ShieldAlert className={`${sz.icon} text-gray-400`} />
        <span className="font-medium">Not Verified</span>
      </div>
    );
  }

  const config = tierConfig[tier] ?? tierConfig.basic;
  return (
    <div
      className={`inline-flex items-center ${sz.wrapper} rounded-full border ${config.border} ${config.bg} ${config.text}`}
    >
      <ShieldCheck className={`${sz.icon} ${config.iconColor}`} />
      <span className="font-semibold">{config.label}</span>
    </div>
  );
}
