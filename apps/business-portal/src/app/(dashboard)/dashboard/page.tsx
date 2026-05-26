'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Users, Star, CheckCircle, Upload, Calendar, Briefcase, ShieldCheck } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReviewsChart } from '@/components/dashboard/ReviewsChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/ui/Button';
import { useBusiness } from '@/hooks/useBusiness';
import { useAnalytics } from '@/hooks/useAnalytics';

const QUICK_ACTIONS = [
  { label: 'Upload Photo', icon: Upload, href: '/photos', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Post Event', icon: Calendar, href: '/events/new', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Post Job', icon: Briefcase, href: '/jobs/new', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { label: 'Get Verified', icon: ShieldCheck, href: '/verification', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
];

export default function DashboardPage() {
  const { business, loading: bizLoading } = useBusiness();
  const { summary, activity, chartData, loading: analyticsLoading } = useAnalytics(business?.id);

  const loading = bizLoading || analyticsLoading;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">
              {business?.name ? `Welcome back, ${business.name.split(' ')[0]}!` : 'Dashboard'}
            </h1>
            <p className="page-subtitle">
              Here&apos;s how your business is performing this month.
            </p>
          </div>
          <Link href="/profile">
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile completeness alert */}
      {!loading && summary && summary.profileCompleteness < 80 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-amber-800">
              Your profile is {summary.profileCompleteness}% complete
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Complete your profile to attract more customers and improve your ranking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${summary.profileCompleteness}%` }}
              />
            </div>
            <Link href="/profile">
              <Button variant="gold" size="sm">Complete Profile</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={<Eye className="h-5 w-5" />}
          label="Total Views"
          value={summary?.totalViews.current.toLocaleString() ?? '—'}
          change={summary?.totalViews.change}
          loading={loading}
          accentColor="green"
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          label="New Followers"
          value={summary?.newFollowers.current.toLocaleString() ?? '—'}
          change={summary?.newFollowers.change}
          loading={loading}
          accentColor="blue"
        />
        <StatsCard
          icon={<Star className="h-5 w-5" />}
          label="Reviews Received"
          value={summary?.reviewsReceived.current ?? '—'}
          subValue={summary ? `Avg. ${summary.reviewsReceived.avgRating} stars` : undefined}
          change={summary?.reviewsReceived.change}
          loading={loading}
          accentColor="gold"
        />
        <StatsCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Profile Complete"
          value={summary ? `${summary.profileCompleteness}%` : '—'}
          loading={loading}
          accentColor="purple"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <ReviewsChart data={chartData} loading={loading} />
        </div>
        <RecentActivity items={activity} loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="section-card">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
            <Link key={href} href={href}>
              <div
                className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors cursor-pointer ${color}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
