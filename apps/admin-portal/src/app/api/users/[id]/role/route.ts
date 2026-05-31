import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/supabase'

const VALID_ROLES: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']

export async function PATCH(
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

    const managerRoles: AdminRole[] = ['admin_manager', 'super_admin']
    if (!callerProfile || !managerRoles.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: manager or above required' },
        { status: 403 }
      )
    }

    const callerRole = callerProfile.role as AdminRole

    // Parse request body
    let body: { role?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const newRole = body.role as AdminRole | undefined
    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Role assignment constraints:
    // - admin_manager can only assign admin_staff
    // - super_admin can assign any valid admin role
    if (callerRole === 'admin_manager' && newRole !== 'admin_staff') {
      return NextResponse.json(
        { error: 'Managers can only assign the admin_staff role' },
        { status: 403 }
      )
    }

    const targetUserId = params.id
    const serviceClient = createSupabaseServiceClient()

    // Verify target user exists
    const { data: targetProfile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const previousRole = targetProfile.role

    // Update the user's role
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Failed to update user role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    // Attempt to log the change to audit_logs if the table exists
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'user.role.updated',
        target_id: targetUserId,
        target_type: 'profile',
        metadata: {
          previous_role: previousRole,
          new_role: newRole,
        },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      role: newRole,
    })
  } catch (error) {
    console.error('Unexpected error in update user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
