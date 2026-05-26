'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface VerificationStatusProps {
  tier: string | null;
  since?: string;
}

const tierLabels: Record<string, string> = {
  basic: 'Greenwood Basic™',
  pro: 'Greenwood Pro™',
  elite: 'Greenwood Elite™',
  community: 'Greenwood Community Trusted™',
};

const tierColors: Record<
  string,
  { bg: string; text: string; icon: string; border: string }
> = {
  basic: { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-600', border: 'border-emerald-200' },
  pro: { bg: 'bg-blue-50', text: 'text-blue-800', icon: 'text-blue-600', border: 'border-blue-200' },
  elite: { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-600', border: 'border-purple-200' },
  community: { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-600', border: 'border-amber-200' },
};

export function VerificationStatus({ tier, since }: VerificationStatusProps) {
  if (!tier) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <ShieldAlert className="h-8 w-8 text-gray-400 shrink-0" />
        <div>
          <p className="font-semibold text-gray-700">Not Verified</p>
          <p className="text-sm text-gray-500">
            Verify your business to build customer trust and unlock more features.
          </p>
        </div>
      </div>
    );
  }

  const colors = tierColors[tier] ?? tierColors.basic;
  const label = tierLabels[tier] ?? tier;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${colors.bg} ${colors.border}`}
    >
      <ShieldCheck className={`h-8 w-8 shrink-0 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${colors.text}`}>{label}</p>
        <p className={`text-sm opacity-80 ${colors.text}`}>
          Your business is verified and trusted by Local First Rewards™
        </p>
      </div>
      {since && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          Since {since}
        </div>
      )}
    </div>
  );
}
