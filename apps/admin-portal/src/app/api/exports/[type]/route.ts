import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase';

type ExportType = 'users' | 'businesses' | 'receipts' | 'analytics' | 'transactions'

const VALID_TYPES: ExportType[] = ['users', 'businesses', 'receipts', 'analytics', 'transactions']

// Converts an array of objects to CSV string
function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    // Wrap in quotes if value contains comma, newline, or double-quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerRow = headers.map(escape).join(',')
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(','))
  return [headerRow, ...dataRows].join('\n')
}

async function exportUsers(serviceClient: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await serviceClient
    .from('profiles')
    .select(
      'id, email, full_name, role, tier, points_balance, city, created_at, last_active_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to query users: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}

async function exportBusinesses(serviceClient: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await serviceClient
    .from('businesses')
    .select(
      'id, name, category, city, status, verification_level, owner_id, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to query businesses: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}

async function exportReceipts(serviceClient: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await serviceClient
    .from('receipts')
    .select(
      'id, user_id, business_id, merchant_name, total, receipt_date, status, fraud_score, points_awarded, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to query receipts: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}

async function exportTransactions(serviceClient: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await serviceClient
    .from('points_transactions')
    .select(
      'id, user_id, amount, type, description, reference_id, reference_type, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to query transactions: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}

async function exportAnalytics(serviceClient: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await serviceClient
    .from('leaderboard_entries')
    .select(
      'user_id, city, state, period, category, rank, score, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to query analytics: ${error.message}`)
  return (data ?? []) as Record<string, unknown>[]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Resolve dynamic segment
    const { type } = await params

    // Validate export type
    if (!VALID_TYPES.includes(type as ExportType)) {
      return NextResponse.json(
        { error: `Invalid export type "${type}". Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const exportType = type as ExportType

    // Authenticate caller
    const authClient = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin may export data
    const { data: callerProfile } = await authClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: super_admin role required to export data' },
        { status: 403 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    // Run the appropriate query
    let rows: Record<string, unknown>[]
    switch (exportType) {
      case 'users':
        rows = await exportUsers(serviceClient)
        break
      case 'businesses':
        rows = await exportBusinesses(serviceClient)
        break
      case 'receipts':
        rows = await exportReceipts(serviceClient)
        break
      case 'analytics':
        rows = await exportAnalytics(serviceClient)
        break
      case 'transactions':
        rows = await exportTransactions(serviceClient)
        break
    }

    const csv = toCSV(rows)
    const filename = `local-first-rewards-${exportType}-${new Date().toISOString().split('T')[0]}.csv`

    // Log export to audit trail
    try {
      await serviceClient.from('audit_logs').insert({
        actor_id: user.id,
        action: `export.${exportType}`,
        target_id: null,
        target_type: exportType,
        metadata: {
          row_count: rows.length,
          exported_by_role: callerProfile.role,
          exported_by_name: callerProfile.full_name ?? null,
          filename,
        },
        created_at: new Date().toISOString(),
      })
    } catch (auditErr) {
      console.warn(`Failed to write audit log for export.${exportType}:`, auditErr)
    }

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/exports/[type]:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
