'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useBusiness } from '@/hooks/useBusiness'
import { createClient } from '@/lib/supabase'
import { format, subMonths, startOfMonth } from 'date-fns'

interface Follower {
  id: string
  user_id: string
  created_at: string
  full_name: string | null
}

interface ChartPoint {
  month: string
  followers: number
}

// Generate cumulative growth chart data from follower records
function buildChartData(followers: Follower[], months = 6): ChartPoint[] {
  const points: ChartPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = startOfMonth(subMonths(now, i - 1))
    const count = followers.filter(f => {
      const d = new Date(f.created_at)
      return d >= monthStart && d < monthEnd
    }).length
    points.push({ month: format(monthStart, 'MMM'), followers: count })
  }
  return points
}

export default function FollowersPage() {
  const supabase = createClient()
  const { business, loading: bizLoading } = useBusiness()

  const [followers, setFollowers] = useState<Follower[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return

    async function load() {
      try {
        // Get total count
        const { count } = await supabase
          .from('business_followers')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', business!.id)

        setTotalCount(count ?? 0)

        // Get recent 50 followers with optional public full_name via join
        const { data } = await supabase
          .from('business_followers')
          .select('id, user_id, created_at, profiles(full_name)')
          .eq('business_id', business!.id)
          .order('created_at', { ascending: false })
          .limit(50)

        const normalized: Follower[] = (data ?? []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          created_at: row.created_at,
          full_name: row.profiles?.full_name ?? null,
        }))

        setFollowers(normalized)
        setChartData(buildChartData(normalized))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [business?.id, supabase])

  // Month-over-month new followers
  const thisMonthStart = startOfMonth(new Date())
  const newThisMonth = followers.filter(f => new Date(f.created_at) >= thisMonthStart).length

  if (bizLoading || loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green-700 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Followers</h1>
        <p className="page-subtitle">See who is following your business and track your growth.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="section-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total followers</p>
          </div>
        </div>

        <div className="section-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <UserPlus size={22} className="text-brand-green-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{newThisMonth}</p>
            <p className="text-sm text-gray-500">New this month</p>
          </div>
        </div>

        <div className="section-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {totalCount > 0 && newThisMonth > 0
                ? `+${Math.round((newThisMonth / (totalCount - newThisMonth || 1)) * 100)}%`
                : '—'}
            </p>
            <p className="text-sm text-gray-500">Growth rate</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="section-card mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Followers Over Time</h2>
        {chartData.every(d => d.followers === 0) ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Not enough data to display a chart yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(v: number) => [v, 'New followers']}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="#1B4332"
                strokeWidth={2.5}
                fill="url(#followerGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent followers list */}
      <div className="section-card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Followers</h2>

        {followers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No followers yet. Share your profile to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {followers.map(follower => (
              <div key={follower.id} className="flex items-center justify-between py-3 gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-green-100 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-brand-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {follower.full_name ?? 'Community Member'}
                  </p>
                </div>
                <time className="text-xs text-gray-400 shrink-0">
                  {format(new Date(follower.created_at), 'MMM d, yyyy')}
                </time>
              </div>
            ))}
          </div>
        )}

        {totalCount > 50 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing 50 most recent of {totalCount.toLocaleString()} total followers.
          </p>
        )}
      </div>
    </div>
  )
}
