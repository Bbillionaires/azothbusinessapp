import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface PatchHoursBody {
  hours: Record<string, DayHours>
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user }, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || !user) {
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

  if (business.owner_id !== user.id) {
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
