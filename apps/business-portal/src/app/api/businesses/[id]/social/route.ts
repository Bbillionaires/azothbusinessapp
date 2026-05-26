import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function buildSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — safe to ignore
          }
        },
      },
    }
  )
}

type RouteParams = { params: Promise<{ id: string }> }

// PATCH /api/businesses/[id]/social — upsert social links (ownership verified)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Allowlist of social fields
  const ALLOWED_FIELDS = ['website', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin']
  const safePayload: Record<string, string | null> = {}

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const val = body[field]
      safePayload[field] = typeof val === 'string' && val.trim().length > 0 ? val.trim() : null
    }
  }

  const { data, error } = await supabase
    .from('business_social')
    .upsert(
      {
        business_id: id,
        ...safePayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ social: data })
}
