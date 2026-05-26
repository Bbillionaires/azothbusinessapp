import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const ADMIN_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']
const MANAGER_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the caller is authenticated and has at least manager-level access
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

    if (!callerProfile || !MANAGER_ROLES.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: admin_manager or super_admin required' },
        { status: 403 }
      )
    }

    const callerRole = callerProfile.role as AdminRole

    // Parse optional request body for a reason
    let body: { reason?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Reason is optional
    }

    const reason =
      typeof body.reason === 'string' ? body.reason.trim() || null : null
    const targetUserId = params.id

    // Prevent self-suspension
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'You cannot suspend your own account' },
        { status: 400 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    // Fetch the target user's profile to check their role
    const { data: targetProfile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('id, role, is_banned')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.is_banned) {
      return NextResponse.json(
        { error: 'User is already suspended' },
        { status: 409 }
      )
    }

    // Prevent non-super_admins from suspending other admins
    const isTargetAdmin = ADMIN_ROLES.includes(targetProfile.role as AdminRole)
    if (isTargetAdmin && callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super_admin can suspend other admin accounts' },
        { status: 403 }
      )
    }

    // Suspend the user (set is_banned = true, store reason in ban_reason)
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({
        is_banned: true,
        ban_reason: reason,
      })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Failed to suspend user:', updateError)
      return NextResponse.json(
        { error: 'Failed to suspend user' },
        { status: 500 }
      )
    }

    // Attempt to log to audit_logs if the table exists
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'user.suspended',
        target_id: targetUserId,
        target_type: 'profile',
        metadata: { reason },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
    })
  } catch (error) {
    console.error('Unexpected error in suspend user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
