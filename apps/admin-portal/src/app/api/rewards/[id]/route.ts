import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const MANAGER_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

async function authorizeManager() {
  const authClient = await createSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return { user: null, error: 'Unauthorized', status: 401 }

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !MANAGER_ROLES.includes(profile.role as AdminRole)) {
    return { user: null, error: 'Forbidden: admin_manager or super_admin required', status: 403 }
  }

  return { user, error: null, status: 200 }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, status } = await authorizeManager()
    if (!user) return NextResponse.json({ error }, { status })

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Only allow safe fields to be updated
    const allowed = ['name', 'description', 'type', 'points_cost', 'value', 'quantity_available', 'is_active', 'expires_at']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('reward_catalog')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    const { data, error: updateError } = await serviceClient
      .from('reward_catalog')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update reward:', updateError)
      return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 })
    }

    return NextResponse.json({ success: true, reward: data })
  } catch (error) {
    console.error('Unexpected error in PATCH reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error, status } = await authorizeManager()
    if (!user) return NextResponse.json({ error }, { status })

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('reward_catalog')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    const { error: deleteError } = await serviceClient
      .from('reward_catalog')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Failed to delete reward:', deleteError)
      return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
