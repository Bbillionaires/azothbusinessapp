import { NextResponse } from 'next/server'

// Health check endpoint — no auth required, used by load balancers / uptime monitors.
// Excluded from middleware auth checks via the matcher config in middleware.ts.
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        // Prevent caching so monitors always get a fresh response
        'Cache-Control': 'no-store',
      },
    }
  )
}
