import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin_manager','super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden — manager or above required' }, { status: 403 });
  }

  const url = req.nextUrl;
  const role = url.searchParams.get('role');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const tier = url.searchParams.get('tier');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25', 10), 100);
  const offset = (page - 1) * limit;

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = service
    .from('profiles')
    .select('id, display_name, email, role, tier, status, points_balance, total_points_earned, legend_tier, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) query = query.eq('role', role);
  if (status) query = query.eq('status', status);
  if (tier) query = query.eq('tier', tier);
  if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, limit });
}
