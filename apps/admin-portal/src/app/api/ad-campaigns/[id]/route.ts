import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const MANAGER_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed', 'rejected'] as const
type CampaignStatus = (typeof VALID_STATUSES)[number]

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

    if (!profile || !MANAGER_ROLES.includes(profile.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: admin_manager or super_admin required' },
        { status: 403 }
      )
    }

    let body: { status?: CampaignStatus } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    const { data: existing, error: fetchError } = await serviceClient
      .from('ad_campaigns')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status !== undefined) updates.status = body.status

    const { data, error: updateError } = await serviceClient
      .from('ad_campaigns')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update ad campaign:', updateError)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: 'ad_campaign.updated',
        target_id: params.id,
        target_type: 'ad_campaign',
        metadata: { status: body.status },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json({ success: true, campaign: data })
  } catch (error) {
    console.error('Unexpected error in patch ad-campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
