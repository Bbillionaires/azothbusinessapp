import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase';

export async function POST(
  _request: Request,
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

    const receiptId = params.id
    const serviceClient = createSupabaseServiceClient()

    // Fetch the receipt to get user_id and total for points calculation
    const { data: receipt, error: fetchError } = await serviceClient
      .from('receipts')
      .select('id, user_id, total, status')
      .eq('id', receiptId)
      .single()

    if (fetchError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.status === 'approved') {
      return NextResponse.json(
        { error: 'Receipt is already approved' },
        { status: 409 }
      )
    }

    // Update receipt status to approved
    const { error: updateError } = await serviceClient
      .from('receipts')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', receiptId)

    if (updateError) {
      console.error('Failed to update receipt:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve receipt' },
        { status: 500 }
      )
    }

    // Award points to the user via the award_points RPC
    const pointsToAward = Math.max(1, Math.floor(receipt.total))
    const { error: rpcError } = await serviceClient.rpc('award_points', {
      p_user_id: receipt.user_id,
      p_amount: pointsToAward,
      p_type: 'earned',
      p_description: `Points awarded for approved receipt #${receiptId.slice(0, 8)}`,
      p_reference_id: receiptId,
      p_reference_type: 'receipt',
    })

    if (rpcError) {
      // Points failed but receipt is already approved — log but don't fail the response
      console.error('Failed to award points via RPC:', rpcError)
    } else {
      // Update points_awarded on the receipt
      await serviceClient
        .from('receipts')
        .update({ points_awarded: pointsToAward })
        .eq('id', receiptId)
    }

    return NextResponse.json({
      success: true,
      receipt_id: receiptId,
      points_awarded: rpcError ? 0 : pointsToAward,
    })
  } catch (error) {
    console.error('Unexpected error in approve receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
