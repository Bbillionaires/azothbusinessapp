import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase'
import type { AdminRole } from '@/lib/supabase'

const MANAGER_ROLES: AdminRole[] = ['admin_manager', 'super_admin']

export async function GET() {
  try {
    const serviceClient = createSupabaseServiceClient()
    const { data, error } = await serviceClient
      .from('reward_catalog')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch rewards:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    return NextResponse.json({ rewards: data ?? [] })
  } catch (error) {
    console.error('Unexpected error in GET rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !MANAGER_ROLES.includes(profile.role as AdminRole)) {
      return NextResponse.json(
        { error: 'Forbidden: admin_manager or super_admin required' },
        { status: 403 }
      )
    }

    let body: {
      name?: string
      description?: string
      type?: string
      points_cost?: number
      value?: number
      quantity_available?: number
      is_active?: boolean
      expires_at?: string
    } = {}

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, description, type, points_cost, value, quantity_available, is_active, expires_at } = body

    if (!name || !type || points_cost === undefined) {
      return NextResponse.json(
        { error: 'name, type, and points_cost are required' },
        { status: 400 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    const { data, error } = await serviceClient
      .from('reward_catalog')
      .insert({
        name,
        description: description ?? null,
        type,
        points_cost,
        value: value ?? null,
        quantity_available: quantity_available ?? null,
        is_active: is_active ?? true,
        expires_at: expires_at ?? null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create reward:', error)
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
    }

    return NextResponse.json({ success: true, reward: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
