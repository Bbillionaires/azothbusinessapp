# Local First Rewards™ — Codebase Guide

## Architecture Overview

This is a Turborepo monorepo with three apps and two packages:

```
apps/
  mobile/           React Native + Expo (consumer app)
  business-portal/  Next.js 14 (business owner dashboard)
  admin-portal/     Next.js 14 (staff/manager/super admin)
packages/
  database/         PostgreSQL migrations (11 files)
  shared/           TypeScript types + constants
supabase/
  functions/        Edge functions (Deno)
  seed/             Development seed data
  config.toml       Local Supabase config
```

## Running Locally

### Prerequisites
- Node.js 20+
- Supabase CLI (`brew install supabase/tap/supabase`)
- Expo CLI (`npm install -g expo-cli`)

### Start everything
```bash
# Install all dependencies
npm install

# Start local Supabase (PostgreSQL + Auth + Storage + Edge Functions)
supabase start

# Apply all migrations
supabase db push

# Seed development data
supabase db seed

# Start all apps
npm run dev
# mobile: expo start (port 8081)
# business-portal: localhost:3001
# admin-portal: localhost:3002
```

### Start individual apps
```bash
npx turbo run dev --filter=@local-first-rewards/mobile
npx turbo run dev --filter=@local-first-rewards/business-portal
npx turbo run dev --filter=@local-first-rewards/admin-portal
```

## Key Concepts

### Points System
- 1 point = $1 spent (admin configurable)
- Points cap: 500/day per user
- Tier multipliers: Silver 1.25x, Gold 1.5x, Platinum 2x, Legend 3x
- Points awarded on receipt approval, not submission

### Fraud Detection (`supabase/functions/_shared/fraud.ts`)
Every receipt runs through 9 checks:
1. Duplicate image hash (SHA-256)
2. Duplicate transaction number (same merchant)
3. Excessive daily submissions (>10/day)
4. Amount exceeds cap ($500 single, $5000/month)
5. OCR anomaly patterns (edited images)
6. Future-dated receipts
7. Stale receipts (>30 days old)
8. New account rapid submission
9. Monthly spending cap

Score 0-29 → auto-approve (trusted users); 30-89 → manual review; 90+ → auto-reject

### Greenwood Check™ Verification
- 4 tiers: Basic ($9.99), Pro ($29.99), Elite ($79.99), Community Trusted (invite only)
- Stripe subscriptions — webhook updates `businesses.verification_level`
- Triggers referral commission to whoever referred the business

### Community Legend System
- Tiers: Bronze → Silver → Gold → Platinum → Legend → Hall of Legends
- Hall of Legends: `is_permanent = true`, never removable from admin portal
- Impact score computed nightly by `compute-analytics` edge function
- Legend tier affects review weight (Legend = 10x)

### Role-Based Access (admin portal)
```
admin_staff    → receipts, businesses (read), disputes
admin_manager  → + users, verification, rewards, advertising, legends
super_admin    → + fraud, audit logs, system settings
```
Enforced by `RoleGuard` component + `permissions.ts`

## Database Migrations

Run in order 001 → 011. Each file is idempotent (uses `IF NOT EXISTS`).

Key tables:
- `profiles` — extends Supabase `auth.users`
- `businesses` — full business profiles with all badge flags
- `receipts` — OCR data, fraud scores, hashes
- `points_transactions` — immutable ledger
- `community_legends` — permanent recognition wall
- `leaderboard_entries` — computed nightly

## Edge Functions

| Function | Trigger | Does |
|---|---|---|
| `process-receipt` | Mobile upload | OCR → fraud check → insert receipt → maybe award points |
| `process-referral` | Any conversion | Award referrer points, update link stats |
| `stripe-webhook` | Stripe POST | Grant verification, activate ad campaigns |
| `send-notification` | Internal | FCM push to user(s) or topic |
| `award-badge` | After actions | Check all 25 badge criteria, award new ones |
| `compute-analytics` | Daily cron | User impact snapshots, leaderboards, legend tiers |

## Adding a New City

1. No code changes required — city is a free-text field on businesses
2. Seed initial businesses for the city
3. Admin creates city-specific ad targeting in `ad_campaigns.target_city`
4. `compute-analytics` will automatically include the new city

## Deployment

### Business Portal → Vercel
```bash
vercel --cwd apps/business-portal
```

### Admin Portal → Vercel
```bash
vercel --cwd apps/admin-portal
# Note: admin portal has noindex headers — not publicly discoverable
```

### Mobile → Expo EAS
```bash
cd apps/mobile
eas build --platform all
eas submit --platform all
```

### Supabase Edge Functions
```bash
supabase functions deploy process-receipt
supabase functions deploy process-referral
supabase functions deploy stripe-webhook
supabase functions deploy send-notification
supabase functions deploy award-badge
supabase functions deploy compute-analytics
```

### Environment Variables
Copy `.env.example` → `.env.local` and fill in all values.
See individual app `.env.local.example` files for app-specific vars.

Required third-party services:
- **Supabase** — database, auth, storage, edge functions
- **Stripe** — payments (subscriptions + one-time)
- **Google Vision API** — receipt OCR
- **Google Maps API** — map view in mobile
- **Firebase** — push notifications
- **Vercel** — web app hosting
- **PostHog** — analytics (optional)
