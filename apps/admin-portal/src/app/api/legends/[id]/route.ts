import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole, LegendTier } from '@/lib/supabase'

const MANAGER_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

const VALID_TIERS: LegendTier[] = ['bronze', 'silver', 'gold', 'platinum', 'legend', 'hall_of_legends']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !MANAGER_ROLES.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json({ error: 'Forbidden: admin_manager or super_admin required' }, { status: 403 })
    }

    let body: { tier?: LegendTier; promote_to_hall?: boolean } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('community_legends')
      .select('id, tier, is_permanent')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Legend not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.promote_to_hall) {
      updates.tier = 'hall_of_legends'
      updates.is_permanent = true
      updates.inducted_at = new Date().toISOString()
    } else if (body.tier) {
      if (!VALID_TIERS.includes(body.tier)) {
        return NextResponse.json(
          { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
          { status: 400 }
        )
      }
      updates.tier = body.tier
    }

    const { data, error: updateError } = await serviceClient
      .from('community_legends')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update legend:', updateError)
      return NextResponse.json({ error: 'Failed to update legend' }, { status: 500 })
    }

    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: body.promote_to_hall ? 'legend.promoted_to_hall' : 'legend.tier_adjusted',
        target_id: params.id,
        target_type: 'community_legend',
        metadata: { tier: updates.tier, is_permanent: updates.is_permanent },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs may not exist
    }

    return NextResponse.json({ success: true, legend: data })
  } catch (error) {
    console.error('Unexpected error in PATCH legend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin required to remove legends' }, { status: 403 })
    }

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('community_legends')
      .select('id, is_permanent, user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Legend not found' }, { status: 404 })
    }

    if (existing.is_permanent) {
      return NextResponse.json(
        { error: 'Hall of Legends members are permanent and cannot be removed' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await serviceClient
      .from('community_legends')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Failed to remove legend:', deleteError)
      return NextResponse.json({ error: 'Failed to remove legend' }, { status: 500 })
    }

    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'legend.removed',
        target_id: existing.user_id,
        target_type: 'profile',
        metadata: { legend_id: params.id },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs may not exist
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE legend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
