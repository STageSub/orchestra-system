import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const COOKIE_NAME = 'orchestra-admin-session'

export async function middleware(request: NextRequest) {
  // Only protect admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // Allow access to login page
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }
  
  // Check for auth cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  // Verify token
  const payload = await verifyToken(token)
  
  if (!payload || !payload.authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}