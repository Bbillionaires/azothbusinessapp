import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/supabase'

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

    // Parse request body
    let body: { featured?: boolean } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (typeof body.featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Request body must include "featured" (boolean)' },
        { status: 400 }
      )
    }

    const businessId = params.id
    const serviceClient = createSupabaseServiceClient()

    // Verify business exists
    const { data: business, error: fetchError } = await serviceClient
      .from('businesses')
      .select('id, is_featured')
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Update featured status
    const { error: updateError } = await serviceClient
      .from('businesses')
      .update({
        is_featured: body.featured,
        featured_at: body.featured ? new Date().toISOString() : null,
        featured_by: body.featured ? user.id : null,
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Failed to update business featured status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update featured status' },
        { status: 500 }
      )
    }

    // Attempt to log to audit_logs if the table exists
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: body.featured ? 'business.featured' : 'business.unfeatured',
        target_id: businessId,
        target_type: 'business',
        metadata: { featured: body.featured },
        created_at: new Date().toISOString(),
      })
    } catch {
      // audit_logs table may not exist — skip silently
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      featured: body.featured,
    })
  } catch (error) {
    console.error('Unexpected error in feature business:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
