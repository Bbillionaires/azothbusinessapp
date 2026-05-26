import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']

// Cache revalidation: 60 seconds
export const revalidate = 60

export async function GET() {
  try {
    // Verify caller is an authenticated admin
    const authClient = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = createSupabaseServiceClient()

    // Run all stat queries in parallel for performance
    const [
      totalUsersResult,
      activeBusinessesResult,
      approvedReceiptsResult,
      totalSpendingResult,
      flaggedReceiptsResult,
      totalReviewsResult,
    ] = await Promise.all([
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      serviceClient
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      serviceClient
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),

      serviceClient
        .from('receipts')
        .select('total_amount')
        .eq('status', 'approved'),

      serviceClient
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .gte('fraud_score', 30),

      serviceClient
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
    ])

    // Compute total spending from approved receipts
    const totalSpending = totalSpendingResult.data
      ? totalSpendingResult.data.reduce(
          (sum: number, row: { total_amount: number | null }) =>
            sum + (row.total_amount ?? 0),
          0
        )
      : 0

    const stats = {
      total_users: totalUsersResult.count ?? 0,
      active_businesses: activeBusinessesResult.count ?? 0,
      approved_receipts: approvedReceiptsResult.count ?? 0,
      total_spending: totalSpending,
      flagged_receipts: flaggedReceiptsResult.count ?? 0,
      total_reviews: totalReviewsResult.count ?? 0,
    }

    return NextResponse.json(
      { stats, generated_at: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Unexpected error in platform stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
