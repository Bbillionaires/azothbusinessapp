import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie (project ref: gfcvwpmxnukvqkyiyhtj)
  const sessionCookie =
    request.cookies.get('sb-gfcvwpmxnukvqkyiyhtj-auth-token') ||
    request.cookies.get('sb-gfcvwpmxnukvqkyiyhtj-auth-token.0') ||
    request.cookies.get('sb-access-token')

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
