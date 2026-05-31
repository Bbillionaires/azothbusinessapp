import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/supabase'

type TargetType = 'all' | 'user' | 'topic' | 'business_followers'

const ALLOWED_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

interface SendNotificationBody {
  title: string
  body: string
  target_type: TargetType
  target_id?: string
}

export async function POST(request: Request) {
  try {
    // Authenticate caller
    const authClient = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify role: admin_manager or super_admin only
    const { data: callerProfile } = await authClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !ALLOWED_ROLES.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: admin_manager or super_admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body: SendNotificationBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, body: messageBody, target_type, target_id } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "title" is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "body" is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const validTargetTypes: TargetType[] = ['all', 'user', 'topic', 'business_followers']
    if (!target_type || !validTargetTypes.includes(target_type)) {
      return NextResponse.json(
        { error: `Field "target_type" must be one of: ${validTargetTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if ((target_type === 'user' || target_type === 'business_followers') && !target_id) {
      return NextResponse.json(
        { error: `Field "target_id" is required when target_type is "${target_type}"` },
        { status: 400 }
      )
    }

    // If targeting a specific user by email, resolve to UUID
    const serviceClient = createSupabaseServiceClient()
    let resolvedTargetId = target_id

    if (target_type === 'user' && target_id) {
      // If target_id looks like an email, try to resolve it to a user ID
      if (target_id.includes('@')) {
        const { data: targetProfile } = await serviceClient
          .from('profiles')
          .select('id')
          .eq('email', target_id.toLowerCase().trim())
          .single()

        if (!targetProfile) {
          return NextResponse.json(
            { error: `No user found with email: ${target_id}` },
            { status: 404 }
          )
        }
        resolvedTargetId = targetProfile.id
      } else {
        // Validate UUID exists in profiles
        const { data: targetProfile } = await serviceClient
          .from('profiles')
          .select('id')
          .eq('id', target_id)
          .single()

        if (!targetProfile) {
          return NextResponse.json(
            { error: `No user found with ID: ${target_id}` },
            { status: 404 }
          )
        }
      }
    }

    // Build payload for the edge function — maps admin target_type to edge fn format
    const notificationPayload: Record<string, unknown> = {
      title: title.trim(),
      body: messageBody.trim(),
      type: 'generic' as const,
    }

    if (target_type === 'user' && resolvedTargetId) {
      notificationPayload.user_id = resolvedTargetId
    } else if (target_type === 'business_followers' && resolvedTargetId) {
      // Fetch follower user IDs for this business
      const { data: followers } = await serviceClient
        .from('business_followers')
        .select('user_id')
        .eq('business_id', resolvedTargetId)
      notificationPayload.user_ids = (followers ?? []).map((f: { user_id: string }) => f.user_id)
    } else if (target_type === 'topic' && resolvedTargetId) {
      notificationPayload.topic = resolvedTargetId
    } else if (target_type === 'all') {
      notificationPayload.topic = 'all_users'
    }

    // Invoke the send-notification Supabase edge function
    const { data: fnResponse, error: fnError } = await serviceClient.functions.invoke(
      'send-notification',
      { body: notificationPayload }
    )

    if (fnError) {
      console.error('send-notification edge function error:', fnError)
      return NextResponse.json(
        { error: 'Failed to send notification via edge function', detail: fnError.message },
        { status: 502 }
      )
    }

    // Log to audit_logs
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'notification.sent',
        target_id: resolvedTargetId ?? null,
        target_type: target_type === 'user' ? 'profile' : target_type,
        metadata: {
          title: title.trim(),
          body: messageBody.trim(),
          target_type,
          target_id: resolvedTargetId ?? null,
          sent_by_role: callerProfile.role,
          sent_by_name: callerProfile.full_name ?? null,
        },
        created_at: new Date().toISOString(),
      })
    } catch (auditErr) {
      // audit_logs table may not exist — skip silently
      console.warn('Failed to write audit log for notification.sent:', auditErr)
    }

    return NextResponse.json(
      {
        success: true,
        recipients: fnResponse?.recipients ?? null,
        message_id: fnResponse?.message_id ?? null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/send:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
