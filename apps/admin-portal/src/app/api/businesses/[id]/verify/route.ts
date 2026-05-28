import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

type VerificationLevel = 'none' | 'basic' | 'pro' | 'elite' | 'community_trusted'

const VALID_VERIFICATION_LEVELS: VerificationLevel[] = [
  'none',
  'basic',
  'pro',
  'elite',
  'community_trusted',
]

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the caller is authenticated and has an admin role
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

    const adminRoles: AdminRole[] = ['admin_staff', 'admin_manager', 'super_admin']
    if (!callerProfile || !adminRoles.includes(callerProfile.role as AdminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    let body: {
      verified?: boolean
      verification_level?: VerificationLevel
      notes?: string
    } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (typeof body.verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Request body must include "verified" (boolean)' },
        { status: 400 }
      )
    }

    if (
      body.verification_level !== undefined &&
      !VALID_VERIFICATION_LEVELS.includes(body.verification_level)
    ) {
      return NextResponse.json(
        {
          error: `Invalid verification_level. Must be one of: ${VALID_VERIFICATION_LEVELS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const businessId = params.id
    const serviceClient = createSupabaseServiceClient()

    // Verify business exists
    const { data: business, error: fetchError } = await serviceClient
      .from('businesses')
      .select('id, status, verification_level')
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Build update payload
    const businessUpdate: Record<string, unknown> = {}

    if (body.verified) {
      // Activate the business and set verification level
      businessUpdate.status = 'active'
      businessUpdate.verification_level =
        body.verification_level ?? 'basic'
    } else {
      // Set verification level to none when unverifying
      businessUpdate.verification_level = 'none'
      businessUpdate.verified_at = null
    }

    // Update the business
    const { error: updateError } = await serviceClient
      .from('businesses')
      .update(businessUpdate)
      .eq('id', businessId)

    if (updateError) {
      console.error('Failed to update business verification:', updateError)
      return NextResponse.json(
        { error: 'Failed to update business verification' },
        { status: 500 }
      )
    }

    // If verified, update any pending verification requests to 'approved'
    if (body.verified) {
      const requestUpdate: Record<string, unknown> = {
        status: 'approved',
        reviewed_by: user.id,
      }
      if (body.notes) {
        requestUpdate.review_notes = body.notes
      }

      await serviceClient
        .from('business_verification_requests')
        .update(requestUpdate)
        .eq('business_id', businessId)
        .eq('status', 'pending')
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      verified: body.verified,
      verification_level: body.verified
        ? (body.verification_level ?? 'basic')
        : 'none',
    })
  } catch (error) {
    console.error('Unexpected error in verify business:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
