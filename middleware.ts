import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-edge'
import { getTenantFromRequest } from '@/lib/tenant-context'

const COOKIE_NAME = 'orchestra-admin-session'

export async function middleware(request: NextRequest) {
  // Check for superadmin switch cookie
  const switchToken = request.cookies.get('orchestra-admin-switch')?.value
  if (switchToken) {
    // Verify and use the switch token instead
    const switchPayload = await verifyToken(switchToken)
    if (switchPayload && switchPayload.isSuperadminSwitch) {
      // Set the regular session cookie and remove the switch cookie
      const response = NextResponse.redirect(request.url)
      response.cookies.set(COOKIE_NAME, switchToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour for switched sessions
        path: '/'
      })
      response.cookies.delete('orchestra-admin-switch')
      return response
    }
  }
  
  // Extract tenant from request
  const tenantId = getTenantFromRequest(request as unknown as Request)
  
  // Add tenant to headers for all API routes
  const headers = new Headers(request.headers)
  if (tenantId) {
    headers.set('x-tenant-id', tenantId)
  }
  
  // Only protect admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next({
      request: {
        headers,
      },
    })
  }
  
  // Allow access to login page
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next({
      request: {
        headers,
      },
    })
  }
  
  try {
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
    
    // Add user info to headers for tenant validation
    if (payload.userId) {
      headers.set('x-user-id', payload.userId)
    }
    
    return NextResponse.next({
      request: {
        headers,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ]
}