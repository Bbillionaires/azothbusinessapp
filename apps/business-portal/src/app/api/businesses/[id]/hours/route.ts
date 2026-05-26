import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface DayHours {
  open: boolean
  from: string
  to: string
}

interface PatchHoursBody {
  hours: Record<string, DayHours>
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Verify authenticated session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businessId = params.id

  // Verify the authenticated user owns this business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  if (business.owner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse and validate request body
  let body: PatchHoursBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.hours || typeof body.hours !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid hours field' }, { status: 400 })
  }

  // Update the hours JSONB field
  const { data: updated, error: updateError } = await supabase
    .from('businesses')
    .update({ hours: body.hours })
    .eq('id', businessId)
    .select('id, hours')
    .single()

  if (updateError) {
    console.error('Failed to update business hours:', updateError)
    return NextResponse.json({ error: 'Failed to update hours' }, { status: 500 })
  }

  return NextResponse.json({ data: updated }, { status: 200 })
}
