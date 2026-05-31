import Link from 'next/link'
import type { Metadata } from 'next'
import { TrendingUp, Users, MapPin, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Invest in Local First Rewards™ | Opportunities',
  description:
    'Discover investment opportunities with Local First Rewards™ — the platform connecting Black-owned and community businesses with loyal local customers.',
}

export const revalidate = 300

const FALLBACK_STATS = [
  { label: 'Businesses on platform', value: '2,400+' },
  { label: 'Active community members', value: '18,000+' },
  { label: 'Cities covered', value: '35' },
  { label: 'Monthly transactions', value: '$1.2M+' },
]

async function fetchStats() {
  try {
    const supabase = await createServerSupabaseClient()

    const [bizRes, profilesRes, citiesRes, pointsRes] = await Promise.all([
      supabase.from('businesses').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('businesses').select('city'),
      supabase.from('points_transactions').select('amount').gt('amount', 0),
    ])

    if (bizRes.error || profilesRes.error || citiesRes.error || pointsRes.error) {
      return null
    }

    const bizCount = bizRes.count ?? 0
    const profileCount = profilesRes.count ?? 0

    const distinctCities = new Set(
      (citiesRes.data ?? [])
        .map((b: { city: string | null }) => b.city?.trim().toLowerCase())
        .filter(Boolean)
    ).size

    const totalPoints = (pointsRes.data ?? []).reduce(
      (sum: number, r: { amount: number }) => sum + (r.amount ?? 0),
      0
    )
    // $1 per point
    const totalDollars = totalPoints

    const formatCount = (n: number, suffix = '+') => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`
      if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K${suffix}`
      return `${n}${suffix}`
    }

    const formatDollars = (n: number) => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M+`
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K+`
      return `$${n}+`
    }

    return [
      { label: 'Businesses on platform', value: formatCount(bizCount) },
      { label: 'Active community members', value: formatCount(profileCount) },
      { label: 'Cities covered', value: String(distinctCities) },
      { label: 'Monthly transactions', value: formatDollars(totalDollars) },
    ]
  } catch {
    return null
  }
}

const WHY_US = [
  {
    icon: <Users size={24} className="text-brand-green-700" />,
    title: 'Community-Driven Growth',
    desc: 'Our loyalty and rewards ecosystem drives repeat visits and genuine brand advocates — not ad spend.',
  },
  {
    icon: <MapPin size={24} className="text-brand-green-700" />,
    title: 'Hyper-Local Network Effects',
    desc: 'Each new city we enter compounds value for all businesses and users in surrounding markets.',
  },
  {
    icon: <ShieldCheck size={24} className="text-brand-green-700" />,
    title: 'Greenwood Check™ Verification',
    desc: 'Businesses invest in credibility tiers, creating recurring SaaS revenue with strong retention.',
  },
  {
    icon: <BarChart2 size={24} className="text-brand-green-700" />,
    title: 'Data-Rich Platform',
    desc: 'Real-time analytics, fraud detection, and AI-assisted insights make us defensible at scale.',
  },
]

const OPPORTUNITIES = [
  {
    title: 'Seed Round',
    badge: 'Open',
    badgeColor: 'bg-green-100 text-green-800',
    description:
      'Join our founding investor cohort. We are raising to expand into 10 new cities and launch the consumer referral marketplace.',
    minInvestment: '$25,000',
    highlights: ['Pro-rata rights', 'Investor advisory board seat', 'Direct founder access'],
  },
  {
    title: 'Community Partner Program',
    badge: 'Open',
    badgeColor: 'bg-blue-100 text-blue-700',
    description:
      'Invest alongside established community organizations. Revenue-share model with quarterly distributions.',
    minInvestment: '$5,000',
    highlights: ['Revenue share', 'Co-marketing opportunities', 'Impact reporting'],
  },
  {
    title: 'Series A (Coming Soon)',
    badge: 'Upcoming',
    badgeColor: 'bg-amber-100 text-amber-800',
    description:
      'We plan to raise a Series A following national expansion. Express interest now to be first in line for allocation.',
    minInvestment: 'TBD',
    highlights: ['First look allocation', 'Early due diligence access', 'Preferred pricing'],
  },
]

const FEATURED_BUSINESSES = [
  { name: 'Soulful Eats', city: 'Atlanta, GA', category: 'Restaurant', tier: 'Elite' },
  { name: 'Crown & Glory Salon', city: 'Houston, TX', category: 'Beauty', tier: 'Pro' },
  { name: 'Greenwood Tech', city: 'Tulsa, OK', category: 'Technology', tier: 'Elite' },
  { name: 'Community Roots Bookstore', city: 'Chicago, IL', category: 'Retail', tier: 'Basic' },
]

export default async function InvestorPage() {
  const stats = (await fetchStats()) ?? FALLBACK_STATS

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-brand-green-900 tracking-tight">
              Local First Rewards<span className="text-brand-gold-400">™</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-brand-green-800 transition-colors"
            >
              Business Login
            </Link>
            <a
              href="mailto:invest@localfirstrewards.com"
              className="px-4 py-2 rounded-lg bg-brand-green-700 text-white text-sm font-semibold hover:bg-brand-green-800 transition-colors"
            >
              Contact Investor Relations
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-900 via-brand-green-800 to-brand-green-700 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#D4AF37,transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-brand-gold-300 mb-6">
            <TrendingUp size={14} />
            Investor Opportunities
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Invest in the Future of{' '}
            <span className="text-brand-gold-300">Black-Owned</span> &amp; Local Commerce
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            Local First Rewards™ is the loyalty, discovery, and community platform built to
            circulate wealth within local ecosystems. We are growing fast — and we want the right
            partners by our side.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gold-400 text-brand-green-900 font-bold text-sm hover:bg-brand-gold-300 transition-colors"
            >
              Browse Opportunities <ArrowRight size={16} />
            </a>
            <a
              href="mailto:invest@localfirstrewards.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/30 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-green-50 border-b border-brand-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold text-brand-green-800">{s.value}</p>
              <p className="text-sm text-brand-green-700 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Why Local First Rewards™?</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            We combine proven SaaS revenue models with the passion-driven loyalty of community
            commerce — a rare combination that creates durable competitive moats.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_US.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-green-50 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Opportunities */}
      <section id="opportunities" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Investment Opportunities</h2>
            <p className="text-gray-500 mt-3">
              Multiple entry points to match your investment thesis and check size.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {OPPORTUNITIES.map((opp, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:border-brand-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">{opp.title}</h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opp.badgeColor}`}
                  >
                    {opp.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">
                  {opp.description}
                </p>
                <div className="mb-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                    Minimum Investment
                  </p>
                  <p className="text-xl font-extrabold text-brand-green-800">
                    {opp.minInvestment}
                  </p>
                </div>
                <ul className="space-y-1.5 mb-6">
                  {opp.highlights.map((h, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:invest@localfirstrewards.com"
                  className="w-full text-center py-2.5 rounded-xl bg-brand-green-700 text-white text-sm font-semibold hover:bg-brand-green-800 transition-colors"
                >
                  Express Interest
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Businesses</h2>
            <p className="text-gray-500 mt-1">
              A sample of the thriving businesses driving revenue on our platform.
            </p>
          </div>
          <Link
            href="/register"
            className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800 inline-flex items-center gap-1"
          >
            Join as a business <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_BUSINESSES.map((biz, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-green-200 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-green-100 flex items-center justify-center mb-3">
                <span className="text-sm font-extrabold text-brand-green-800">
                  {biz.name.charAt(0)}
                </span>
              </div>
              <p className="font-bold text-gray-900 mb-0.5">{biz.name}</p>
              <p className="text-xs text-gray-500 mb-3">
                {biz.city} &middot; {biz.category}
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-green-50 text-brand-green-700 text-xs font-semibold">
                <ShieldCheck size={11} />
                {biz.tier} Verified
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-green-900 text-white py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Ready to Invest in Community Commerce?
          </h2>
          <p className="text-white/75 text-lg mb-8">
            Join the movement. Reach out to our investor relations team or create a business
            account to experience the platform firsthand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:invest@localfirstrewards.com"
              className="px-8 py-3.5 rounded-xl bg-brand-gold-400 text-brand-green-900 font-bold hover:bg-brand-gold-300 transition-colors"
            >
              Contact Investor Relations
            </a>
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Create Business Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Local First Rewards™. All rights reserved.
          </p>
          <p>
            Investment inquiries:{' '}
            <a
              href="mailto:invest@localfirstrewards.com"
              className="text-brand-green-700 hover:underline"
            >
              invest@localfirstrewards.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
