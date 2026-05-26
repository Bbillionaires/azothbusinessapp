# Local First Rewards™

> Platform helping small/local Black-owned businesses compete against corporations through rewards, gamification, and community.

## Overview

Local First Rewards™ is a full-stack loyalty and community platform with three surfaces:

- **Consumer mobile app** (React Native + Expo) — shop local, submit receipts, earn points, climb the Community Legend leaderboard
- **Business portal** (Next.js 14) — manage listings, run ad campaigns, create reward offers, view analytics
- **Admin portal** (Next.js 14) — review receipts, manage verification, monitor fraud, export data, configure the platform

Supporting infrastructure runs on Supabase (PostgreSQL + Auth + Storage + Edge Functions), Stripe for payments, Google Vision for OCR, and Firebase for push notifications.

---

## Architecture

Turborepo monorepo:

```
apps/
  mobile/           React Native + Expo (iOS/Android consumer app)
  business-portal/  Next.js 14 — business owner dashboard (port 3001)
  admin-portal/     Next.js 14 — staff/manager/super admin panel (port 3002)
packages/
  database/         SQL migrations (Supabase/PostgreSQL, run in order 001→015)
  shared/           Shared TypeScript types + constants (published as @local-first-rewards/shared)
supabase/
  functions/        Deno edge functions (deployed to Supabase)
  seed/             Development seed data
  config.toml       Local Supabase configuration
```

---

## Key Features

### Rewards & Points Engine
- 1 point = $1 spent (admin-configurable ratio)
- Points awarded on receipt approval (not submission)
- Daily cap: 500 points/user; single receipt cap: $500; monthly cap: $5,000
- Tier multipliers: Silver 1.25×, Gold 1.5×, Platinum 2×, Legend 3×

### Receipt OCR + Fraud Detection
- Google Vision API extracts merchant name, amount, date, transaction number
- 9-check fraud engine (duplicate hash, duplicate transaction number, excessive daily submissions, amount caps, OCR anomaly patterns, future-dated receipts, stale receipts, new account rapid submission, monthly spending cap)
- Score 0–29 → auto-approve; 30–89 → manual review queue; 90+ → auto-reject

### Community Legend System™
- Tiers: Bronze → Silver → Gold → Platinum → Legend → **Hall of Legends** (permanent — never removable)
- Impact score computed nightly from: receipt points + referral bonuses + review contributions + event attendance + streaks
- Legend tier affects review weight (Legend = 10× influence)

### Greenwood Check™ Business Verification
- 4 tiers: Basic ($9.99/mo), Pro ($29.99/mo), Elite ($79.99/mo), Community Trusted (invite only)
- Stripe subscription webhook updates `businesses.verification_level`
- Referral commissions automatically distributed on verification upgrade

### Referral Marketplace™
- Pay-per-lead, pay-per-appointment, pay-per-sale, and affiliate models
- Tracking links with conversion attribution
- Real-time commission ledger

### Gamification
- 25+ badges with tiered criteria evaluated after key actions
- Spending streaks tracked weekly and monthly
- City-level and global leaderboards (updated nightly)

### Dashboards
- **Local Impact Dashboard™** — per-user spending impact, badge progress, streak calendar
- **Economic Development Dashboard™** — citywide analytics, aggregate spending by neighborhood

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Expo CLI (`npm install -g expo-cli`)

### Install

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in all values. See individual app `.env.local.example` files for app-specific variables.

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_BASIC` | Stripe price ID for Greenwood Basic |
| `STRIPE_PRICE_PRO` | Stripe price ID for Greenwood Pro |
| `STRIPE_PRICE_ELITE` | Stripe price ID for Greenwood Elite |
| `GOOGLE_VISION_API_KEY` | Google Vision API key (OCR) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (mobile map view) |
| `FIREBASE_PROJECT_ID` | Firebase project ID (push notifications) |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `POSTHOG_PROJECT_KEY` | PostHog project API key (optional analytics) |

### Database Setup

Apply migrations in order using Supabase SQL editor or CLI:

```
packages/database/migrations/001_core_auth.sql
packages/database/migrations/002_...
...through...
packages/database/migrations/015_audit_logs.sql
```

Then run `supabase/config/storage.sql` to create storage buckets (receipts, avatars, business photos).

### Local Supabase

```bash
# Start local Supabase stack (PostgreSQL + Auth + Storage + Edge Functions)
supabase start

# Apply all migrations
supabase db push

# Seed development data
supabase db seed
```

### Development

```bash
# All apps simultaneously (via Turborepo)
pnpm dev

# Mobile only
cd apps/mobile && npx expo start
# Opens on Expo Go / simulator — port 8081

# Business portal only
cd apps/business-portal && pnpm dev
# http://localhost:3001

# Admin portal only
cd apps/admin-portal && pnpm dev
# http://localhost:3002
```

---

## Deployment

### Mobile (EAS Build + Submit)

```bash
cd apps/mobile
eas build --platform all --profile production
eas submit --platform all --profile production
```

### Web Portals (Vercel)

Both portals deploy to Vercel. See `vercel.json` in each app directory.

```bash
# Business portal
vercel --cwd apps/business-portal

# Admin portal (noindex headers applied — not publicly discoverable)
vercel --cwd apps/admin-portal
```

### Edge Functions

```bash
# Deploy all functions
supabase functions deploy --all

# Or deploy individually
supabase functions deploy process-receipt
supabase functions deploy process-referral
supabase functions deploy stripe-webhook
supabase functions deploy send-notification
supabase functions deploy award-badge
supabase functions deploy compute-analytics
```

---

## User Roles

| Role | Access |
|------|--------|
| `consumer` | Mobile app — earn/redeem points, submit receipts, follow businesses |
| `business` | Business portal — manage listing, rewards catalog, ad campaigns |
| `investor` | Browse investment opportunities on business profiles |
| `advertiser` | Create and manage ad campaigns |
| `admin_staff` | Admin portal — review receipts, read businesses, manage disputes |
| `admin_manager` | All `admin_staff` + users, verification, rewards, advertising, legends |
| `super_admin` | Full access including fraud dashboard, audit logs, system settings, data exports |

Role access is enforced by the `RoleGuard` component and `permissions.ts` on the admin portal.

---

## Greenwood Check™ Tiers

| Tier | Price | Features |
|------|-------|---------|
| Basic | $9.99/mo | Verified badge, priority listing in search results |
| Pro | $29.99/mo | + Business analytics dashboard, featured placement |
| Elite | $79.99/mo | + API access, dedicated support, premium ad placements |
| Community Trusted | Invite-only | Verified by community vote — no monthly fee |

---

## Community Legend Tiers

Bronze → Silver → Gold → Platinum → Legend → **Hall of Legends** (permanent)

**Impact score** is computed nightly by the `compute-analytics` edge function from:
- Receipt points earned
- Referral bonuses
- Review contributions (weighted by reviewer tier)
- Event attendance
- Streak bonuses

Hall of Legends members have `is_permanent = true` and cannot be demoted or removed from the admin portal.

---

## Edge Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `process-receipt` | HTTP POST (mobile upload) | OCR via Google Vision → 9-check fraud engine → insert receipt → award points if auto-approved |
| `process-referral` | HTTP POST | Attribution of referral conversions → award referrer points, update link stats |
| `stripe-webhook` | Stripe webhook POST | Grant/revoke verification tiers, activate ad campaigns, trigger referral commissions |
| `send-notification` | HTTP POST | Send FCM push notification to a user, topic, or broadcast to all |
| `award-badge` | HTTP POST | Evaluate all 25 badge criteria for a user, award any newly earned badges |
| `compute-analytics` | Cron (daily at midnight) | User impact snapshots, leaderboard entries, legend tier promotions |

---

## Third-Party Services

| Service | Purpose |
|---------|---------|
| **Supabase** | Database, Auth, Storage, Edge Functions |
| **Stripe** | Subscription payments (Greenwood Check), one-time payments, ad billing |
| **Google Vision API** | Receipt OCR — extract merchant, amount, date, transaction number |
| **Google Maps API** | Map view in mobile app |
| **Firebase** | Push notifications (FCM) to iOS and Android |
| **Vercel** | Web portal hosting |
| **PostHog** | Product analytics (optional) |

---

## Developer Guide

See [CLAUDE.md](./CLAUDE.md) for:
- Detailed architecture overview
- Key concept explanations (fraud scoring, tier multipliers, legend system, role-based access)
- Database migration order and key table descriptions
- Edge function reference
- Adding a new city
- Environment variable reference

---

## License

Private — All rights reserved. © Local First Rewards™
