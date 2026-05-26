'use client';

import React from 'react';
import { ShieldCheck, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { VerificationTierId } from '@/lib/stripe';

interface VerificationTierCardProps {
  tierId: VerificationTierId;
  name: string;
  price: number | null;
  features: readonly string[];
  currentTier: string | null;
  onPurchase: (tierId: VerificationTierId) => void;
  loading?: boolean;
}

const tierStyles: Record<
  VerificationTierId,
  {
    gradient: string;
    border: string;
    badge: string;
    badgeText: string;
    iconBg: string;
    iconColor: string;
    recommended?: boolean;
  }
> = {
  basic: {
    gradient: 'from-emerald-50 to-white',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    badgeText: 'Starter',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  pro: {
    gradient: 'from-blue-50 to-white',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    badgeText: 'Most Popular',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    recommended: true,
  },
  elite: {
    gradient: 'from-purple-50 to-white',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    badgeText: 'Best Value',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  community: {
    gradient: 'from-amber-50 to-white',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    badgeText: 'Invitation Only',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
};

export function VerificationTierCard({
  tierId,
  name,
  price,
  features,
  currentTier,
  onPurchase,
  loading = false,
}: VerificationTierCardProps) {
  const styles = tierStyles[tierId];
  const isCurrentTier = currentTier === tierId;
  const isInvitationOnly = tierId === 'community';

  const tierOrder = ['basic', 'pro', 'elite', 'community'];
  const currentTierIndex = tierOrder.indexOf(currentTier ?? '');
  const thisTierIndex = tierOrder.indexOf(tierId);
  const isLowerThanCurrent = thisTierIndex < currentTierIndex;

  return (
    <div
      className={[
        'relative rounded-2xl border-2 bg-gradient-to-b p-6 flex flex-col transition-shadow',
        styles.gradient,
        styles.border,
        styles.recommended ? 'shadow-lg ring-2 ring-blue-400/30' : 'shadow-card hover:shadow-card-hover',
      ].join(' ')}
    >
      {/* Recommended ribbon */}
      {styles.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Current indicator */}
      {isCurrentTier && (
        <div className="absolute top-4 right-4">
          <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mb-3`}>
          {isInvitationOnly ? (
            <Lock className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>

        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge} mb-2 inline-block`}>
          {styles.badgeText}
        </span>

        <h3 className="text-lg font-bold text-gray-900 leading-tight">{name}</h3>

        <div className="mt-2">
          {price !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">${price.toFixed(2)}</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-amber-700">By Invitation</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className={`h-4 w-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentTier ? (
        <Button variant="secondary" fullWidth disabled>
          Current Plan
        </Button>
      ) : isInvitationOnly ? (
        <Button variant="ghost" fullWidth disabled>
          Request Invitation
        </Button>
      ) : isLowerThanCurrent ? (
        <Button variant="ghost" fullWidth disabled>
          Downgrade
        </Button>
      ) : (
        <Button
          variant={styles.recommended ? 'primary' : 'secondary'}
          fullWidth
          loading={loading}
          onClick={() => onPurchase(tierId)}
        >
          {currentTier ? 'Upgrade to ' : 'Get '}
          {name.split('™')[0].replace('Greenwood ', '')}
        </Button>
      )}
    </div>
  );
}
