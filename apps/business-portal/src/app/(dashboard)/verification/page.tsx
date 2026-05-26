'use client';

import { useState } from 'react';
import { ShieldCheck, Check, Lock } from 'lucide-react';

const TIERS = [
  {
    id: 'basic',
    name: 'Greenwood Basic™',
    price: 9.99,
    badge: '✔',
    color: '#6B7280',
    bg: '#F9FAFB',
    border: '#D1D5DB',
    items: ['Phone number verified', 'Email address verified', 'Identity verified'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Greenwood Pro™',
    price: 29.99,
    badge: '✔✔',
    color: '#1B4332',
    bg: '#F0FDF4',
    border: '#1B4332',
    items: [
      'Everything in Basic',
      'Business registration verified',
      'Physical address verified',
      'Website verified',
      'Social profiles verified',
    ],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Greenwood Elite™',
    price: 79.99,
    badge: '✔✔✔',
    color: '#D4AF37',
    bg: '#FFFBEB',
    border: '#D4AF37',
    items: [
      'Everything in Pro',
      'Business license verification',
      'Insurance verification',
      'Reputation verification',
      'Operational verification',
    ],
    popular: false,
  },
  {
    id: 'community_trusted',
    name: 'Greenwood Community Trusted™',
    price: null,
    badge: '👑',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#7C3AED',
    items: [
      'Invitation-only — highest trust level',
      'Displayed prominently in all search results',
      'Special community recognition badge',
      'Priority listing placement',
      'Community trust seal',
    ],
    popular: false,
  },
];

const BENEFITS = [
  { icon: '🔍', title: 'Higher Search Ranking', desc: 'Verified businesses rank higher in local search results' },
  { icon: '🛡️', title: 'Build Consumer Trust', desc: 'Verification badges signal credibility to potential customers' },
  { icon: '📈', title: 'More Profile Views', desc: 'Verified businesses get 3x more profile views on average' },
  { icon: '⭐', title: 'Featured in Results', desc: 'Appear in "Greenwood Verified" filter searches' },
];

export default function VerificationPage() {
  const [currentLevel] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const handlePurchase = async (tierId: string, price: number | null) => {
    if (!price) return;
    setProcessing(tierId);
    // In production: call Stripe checkout session API
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(null);
    alert(`Redirecting to Stripe checkout for ${TIERS.find(t => t.id === tierId)?.name}...`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Greenwood Check™ Verification</h1>
        <p className="mt-1 text-gray-500">
          Build trust with local consumers by verifying your business. Verified businesses rank higher
          and attract more customers.
        </p>
      </div>

      {/* Benefits row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BENEFITS.map((b, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-3xl mb-2">{b.icon}</div>
            <p className="font-semibold text-sm text-gray-900">{b.title}</p>
            <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Verification tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className="relative rounded-2xl border-2 overflow-hidden flex flex-col"
            style={{ borderColor: tier.border, backgroundColor: tier.bg }}
          >
            {tier.popular && (
              <div className="absolute top-0 left-0 right-0 text-center py-1 text-xs font-bold text-white"
                style={{ backgroundColor: tier.color }}>
                Most Popular
              </div>
            )}

            <div className={`p-6 flex-1 flex flex-col ${tier.popular ? 'pt-10' : ''}`}>
              <div className="text-3xl mb-3">{tier.badge}</div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{tier.name}</h3>

              {tier.price !== null ? (
                <div className="mb-4">
                  <span className="text-3xl font-extrabold" style={{ color: tier.color }}>
                    ${tier.price}
                  </span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-1">
                  <Lock size={16} className="text-purple-600" />
                  <span className="font-bold text-purple-700">Invitation Only</span>
                </div>
              )}

              <ul className="space-y-2 flex-1">
                {tier.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                    {item}
                  </li>
                ))}
              </ul>

              {tier.price !== null ? (
                <button
                  onClick={() => handlePurchase(tier.id, tier.price)}
                  disabled={processing === tier.id || currentLevel === tier.id}
                  className="mt-6 w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: tier.color }}
                >
                  {processing === tier.id
                    ? 'Processing...'
                    : currentLevel === tier.id
                    ? '✓ Current Plan'
                    : `Get ${tier.name.split('™')[0]}`}
                </button>
              ) : (
                <button
                  disabled
                  className="mt-6 w-full py-3 rounded-xl font-bold text-purple-700 text-sm bg-purple-100 cursor-not-allowed"
                >
                  By Invitation Only
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How long does verification take?', a: 'Basic verification takes 1–2 business days. Pro and Elite verifications take 3–5 business days.' },
            { q: 'What documents do I need?', a: 'For Pro: business license, utility bill for address. For Elite: all Pro documents plus insurance certificate and any professional licenses.' },
            { q: 'Can I upgrade my tier?', a: 'Yes, you can upgrade at any time. You\'ll only pay the difference in price.' },
            { q: 'What is Greenwood Community Trusted?', a: 'This is our highest tier, available by invitation only to businesses that have demonstrated exceptional community impact and trust.' },
          ].map((faq, i) => (
            <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="font-semibold text-gray-900 mb-1">{faq.q}</p>
              <p className="text-gray-600 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
