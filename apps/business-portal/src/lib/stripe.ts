import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

// Client-side Stripe promise (singleton)
let stripePromise: ReturnType<typeof loadStripe>;
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

export const VERIFICATION_TIERS = {
  basic: {
    id: 'basic',
    name: 'Greenwood Basic™',
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_GREENWOOD_BASIC,
    color: 'emerald',
    features: [
      'Phone number verified',
      'Email address verified',
      'Identity verified',
      'Basic trust badge',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Greenwood Pro™',
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_GREENWOOD_PRO,
    color: 'blue',
    features: [
      'Business registration verified',
      'Physical address verified',
      'Website ownership verified',
      'Social media verified',
      'Pro trust badge',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Greenwood Elite™',
    price: 79.99,
    priceId: process.env.STRIPE_PRICE_GREENWOOD_ELITE,
    color: 'purple',
    features: [
      'Business license verified',
      'Insurance verification',
      'Reputation background check',
      'Operational history verified',
      'Elite trust badge',
      'Priority support',
    ],
  },
  community: {
    id: 'community',
    name: 'Greenwood Community Trusted™',
    price: null,
    priceId: null,
    color: 'gold',
    features: [
      'All Elite features included',
      'Community endorsement',
      'Featured placement',
      'Dedicated account manager',
      'Invitation-only status',
    ],
  },
} as const;

export type VerificationTierId = keyof typeof VERIFICATION_TIERS;
