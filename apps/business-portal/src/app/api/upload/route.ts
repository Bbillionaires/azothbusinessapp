import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

function buildSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// POST /api/upload — upload a business photo to Supabase Storage
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const businessId = formData.get('business_id') as string | null

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (!businessId) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: JPEG, PNG, WebP, GIF' },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB' }, { status: 400 })
  }

  // Verify user owns this business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 })
  }

  // Build storage path
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const uuid = randomUUID()
  const storagePath = `${businessId}/${uuid}.${ext}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('business-photos')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('business-photos')
    .getPublicUrl(storagePath)

  // Record in business_photos table
  const { data: photoRecord, error: dbError } = await supabase
    .from('business_photos')
    .insert({
      business_id: businessId,
      url: publicUrl,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    // Attempt to clean up orphaned storage file — non-fatal
    await supabase.storage.from('business-photos').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl, id: photoRecord.id }, { status: 201 })
}
