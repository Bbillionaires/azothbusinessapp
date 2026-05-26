'use client';

import { useState } from 'react';
import { Trophy, Star, TrendingUp, Users, Award, Lock } from 'lucide-react';

const TIERS = [
  { id: 'bronze', label: 'Bronze Supporter', emoji: '🥉', color: '#CD7F32', min_score: 100, count: 234 },
  { id: 'silver', label: 'Silver Supporter', emoji: '🥈', color: '#C0C0C0', min_score: 500, count: 87 },
  { id: 'gold', label: 'Gold Supporter', emoji: '🥇', color: '#D4AF37', min_score: 2000, count: 34 },
  { id: 'platinum', label: 'Platinum Supporter', emoji: '💎', color: '#E5E4E2', min_score: 5000, count: 12 },
  { id: 'legend', label: 'Community Legend', emoji: '🏆', color: '#1B4332', min_score: 10000, count: 6 },
  { id: 'hall_of_legends', label: 'Hall of Legends', emoji: '👑', color: '#7C3AED', min_score: 50000, count: 2 },
];

const MOCK_LEGENDS = [
  {
    id: '1',
    name: 'Tanisha Williams',
    tier: 'hall_of_legends',
    impact_score: 82400,
    referrals: 247,
    businesses_referred: 18,
    local_spending: 45200,
    reviews: 203,
    events: 89,
    inducted: '2023-01-15',
    is_permanent: true,
  },
  {
    id: '2',
    name: 'Robert "Bobby" Jackson',
    tier: 'legend',
    impact_score: 18200,
    referrals: 89,
    businesses_referred: 7,
    local_spending: 12400,
    reviews: 78,
    events: 45,
    inducted: '2023-06-22',
    is_permanent: false,
  },
  {
    id: '3',
    name: 'Keisha Thompson',
    tier: 'legend',
    impact_score: 14800,
    referrals: 64,
    businesses_referred: 5,
    local_spending: 9800,
    reviews: 112,
    events: 38,
    inducted: '2023-09-01',
    is_permanent: false,
  },
  {
    id: '4',
    name: 'Marcus Freeman',
    tier: 'platinum',
    impact_score: 6200,
    referrals: 32,
    businesses_referred: 3,
    local_spending: 5400,
    reviews: 45,
    events: 22,
    inducted: '2024-01-10',
    is_permanent: false,
  },
];

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hall_of_legends: { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700' },
  legend: { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-700' },
  platinum: { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-700' },
  gold: { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-700' },
  silver: { bg: 'bg-slate-600/40', text: 'text-gray-300', border: 'border-slate-500' },
  bronze: { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-700' },
};

export default function LegendsPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [promoteUserId, setPromoteUserId] = useState<string | null>(null);

  const displayed = MOCK_LEGENDS.filter(l =>
    !selectedTier || l.tier === selectedTier
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Community Legend System™</h1>
        <p className="text-gray-400 mt-1">Manage the permanent recognition system for top community contributors</p>
      </div>

      {/* Tier overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {TIERS.map(tier => (
          <button
            key={tier.id}
            onClick={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
            className={`rounded-xl border p-4 text-center transition-all ${
              selectedTier === tier.id ? `${TIER_COLORS[tier.id]?.bg} ${TIER_COLORS[tier.id]?.border} border-2` : 'bg-slate-800 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="text-2xl">{tier.emoji}</div>
            <div className="text-xs font-semibold text-gray-300 mt-1 leading-tight">{tier.label}</div>
            <div className={`text-lg font-bold mt-1 ${TIER_COLORS[tier.id]?.text ?? 'text-gray-200'}`}>
              {tier.count}
            </div>
            <div className="text-xs text-gray-500">{tier.count === 1 ? 'member' : 'members'}</div>
          </button>
        ))}
      </div>

      {/* Hall of Legends permanence notice */}
      <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-4 flex items-start gap-3">
        <Lock size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-purple-300">Hall of Legends — Permanent Recognition</p>
          <p className="text-sm text-purple-400 mt-0.5">
            Hall of Legends members are permanently displayed and can never be removed from the platform. This is the highest honor in the Local First Rewards™ ecosystem.
          </p>
        </div>
      </div>

      {/* Legend wall */}
      <div className="space-y-4">
        <h2 className="font-bold text-gray-100 text-lg">Community Legend Wall</h2>
        {displayed.map(legend => {
          const tierInfo = TIERS.find(t => t.id === legend.tier);
          const colors = TIER_COLORS[legend.tier];
          return (
            <div key={legend.id} className={`rounded-2xl border overflow-hidden ${colors?.bg ?? 'bg-slate-800'} ${colors?.border ?? 'border-slate-700'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-gray-200">
                        {legend.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-xl">{tierInfo?.emoji}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-100 text-lg">{legend.name}</span>
                        {legend.is_permanent && (
                          <span className="text-xs bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Lock size={10} /> Permanent
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors?.text ?? ''}`}>
                        {tierInfo?.label}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">Inducted {legend.inducted}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">{legend.impact_score.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Impact Score</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-white/10">
                  {[
                    { icon: <Users size={14} />, label: 'Referrals', value: legend.referrals },
                    { icon: <Award size={14} />, label: 'Biz Referred', value: legend.businesses_referred },
                    { icon: <TrendingUp size={14} />, label: 'Local Spend', value: `$${(legend.local_spending / 1000).toFixed(1)}k` },
                    { icon: <Star size={14} />, label: 'Reviews', value: legend.reviews },
                    { icon: <Trophy size={14} />, label: 'Events', value: legend.events },
                  ].map((metric, i) => (
                    <div key={i} className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">{metric.icon}</div>
                      <div className="font-bold text-gray-200">{metric.value}</div>
                      <div className="text-xs text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Admin actions */}
                {!legend.is_permanent && (
                  <div className="flex gap-2 mt-4">
                    <button className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold">
                      Promote to Hall of Legends
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-gray-200 rounded-lg font-semibold">
                      Adjust Tier
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-300 rounded-lg font-semibold">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
