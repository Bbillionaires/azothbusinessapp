import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { status?: string; priority?: string; resolution_note?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { status, priority, resolution_note } = body
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (resolution_note !== undefined) updates.resolution_note = resolution_note

    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString()
      updates.assigned_to = user.id
    }

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('disputes')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    const { data, error: updateError } = await serviceClient
      .from('disputes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update dispute:', updateError)
      return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 })
    }

    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'dispute.updated',
        target_id: params.id,
        target_type: 'dispute',
        metadata: { status, priority, resolution_note },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json({ success: true, dispute: data })
  } catch (error) {
    console.error('Unexpected error in patch dispute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
