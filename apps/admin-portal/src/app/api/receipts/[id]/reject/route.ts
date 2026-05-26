import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'

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

    const adminRoles = ['admin_staff', 'admin_manager', 'super_admin']
    if (!callerProfile || !adminRoles.includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    let body: { reason?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Body is optional — rejection reason can be empty
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : null
    const receiptId = params.id
    const serviceClient = createSupabaseServiceClient()

    // Verify receipt exists
    const { data: receipt, error: fetchError } = await serviceClient
      .from('receipts')
      .select('id, status')
      .eq('id', receiptId)
      .single()

    if (fetchError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.status === 'rejected') {
      return NextResponse.json(
        { error: 'Receipt is already rejected' },
        { status: 409 }
      )
    }

    // Update receipt status to rejected
    const { error: updateError } = await serviceClient
      .from('receipts')
      .update({
        status: 'rejected',
        review_notes: reason ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', receiptId)

    if (updateError) {
      console.error('Failed to reject receipt:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject receipt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt_id: receiptId,
    })
  } catch (error) {
    console.error('Unexpected error in reject receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
