import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin_staff','admin_manager','super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const verification = url.searchParams.get('verification');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25', 10), 100);
  const offset = (page - 1) * limit;

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = service
    .from('businesses')
    .select('id, name, category, city, state, status, verification_level, verified_at, is_featured, created_at, owner_id, profiles!inner(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (verification) query = query.eq('verification_level', verification);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ businesses: data ?? [], total: count ?? 0, page, limit });
}
