import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function buildSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}

type RouteParams = { params: Promise<{ id: string }> }

const ALLOWED_PLATFORMS = ['website', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin'] as const

// PATCH /api/businesses/[id]/social — upsert social links (one row per platform)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const toUpsert: { business_id: string; platform: string; url: string }[] = []
  const toDelete: string[] = []

  for (const platform of ALLOWED_PLATFORMS) {
    const val = body[platform]
    const url = typeof val === 'string' ? val.trim() : ''
    if (url) {
      toUpsert.push({ business_id: id, platform, url })
    } else {
      toDelete.push(platform)
    }
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from('business_social')
      .upsert(toUpsert, { onConflict: 'business_id,platform' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('business_social')
      .delete()
      .eq('business_id', id)
      .in('platform', toDelete)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
