import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole, LegendTier } from '@/lib/supabase'

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']

const VALID_TIERS: LegendTier[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'legend',
  'hall_of_legends',
]

// GET — list all community legends with user info
export async function GET() {
  try {
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

    const { data: legends, error } = await serviceClient
      .from('community_legends')
      .select(
        `
        id,
        user_id,
        tier,
        impact_score,
        referrals_count,
        businesses_referred,
        local_spending_total,
        reviews_count,
        events_attended,
        is_permanent,
        inducted_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          email
        )
      `
      )
      .order('impact_score', { ascending: false })

    if (error) {
      console.error('Failed to fetch legends:', error)
      return NextResponse.json(
        { error: 'Failed to fetch legends' },
        { status: 500 }
      )
    }

    return NextResponse.json({ legends: legends ?? [] })
  } catch (error) {
    console.error('Unexpected error in GET legends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST — manually promote a user to community_legends (super_admin only)
export async function POST(request: Request) {
  try {
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

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: super_admin required to promote legends' },
        { status: 403 }
      )
    }

    // Parse request body
    let body: {
      user_id?: string
      tier?: LegendTier
      notes?: string
      is_permanent?: boolean
    } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body.user_id || typeof body.user_id !== 'string') {
      return NextResponse.json(
        { error: 'Request body must include "user_id"' },
        { status: 400 }
      )
    }

    const tier = body.tier ?? 'bronze'
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    // Verify the target user exists
    const { data: targetProfile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', body.user_id)
      .single()

    if (fetchError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a legend — upsert to allow tier updates
    const { data: legend, error: upsertError } = await serviceClient
      .from('community_legends')
      .upsert(
        {
          user_id: body.user_id,
          tier,
          is_permanent: body.is_permanent ?? (tier === 'hall_of_legends'),
          inducted_at: new Date().toISOString(),
          legend_bio: body.notes ?? null,
        },
        { onConflict: 'user_id' }
      )
      .select('id, user_id, tier, is_permanent, inducted_at')
      .single()

    if (upsertError) {
      console.error('Failed to promote legend:', upsertError)
      return NextResponse.json(
        { error: 'Failed to promote user to legend' },
        { status: 500 }
      )
    }

    // Attempt to log to audit_logs if the table exists
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'legend.promoted',
        target_id: body.user_id,
        target_type: 'profile',
        metadata: {
          tier,
          is_permanent: body.is_permanent ?? (tier === 'hall_of_legends'),
          legend_bio: body.notes ?? null,
        },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json(
      {
        success: true,
        legend,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST legends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
