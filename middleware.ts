import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { isSafari } from '@/lib/user-agent'

// Inline getSubdomain to avoid importing database-config which has Prisma
function getSubdomain(hostname: string): string {
  // Extract subdomain from hostname
  const parts = hostname.split('.')
  
  // Handle localhost with subdomain (e.g., goteborg.localhost:3000)
  if (hostname.includes('localhost')) {
    if (parts.length >= 2) {
      // Return the subdomain part (e.g., 'goteborg' from 'goteborg.localhost:3000')
      return parts[0]
    }
    return 'localhost'
  }

  // Handle production domains (e.g., goteborg.stagesub.com)
  if (parts.length >= 3) {
    return parts[0]
  }

  // Default to admin for main domain
  return 'admin'
}

const COOKIE_NAME = 'orchestra-admin-session'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3001'
  const subdomain = getSubdomain(hostname)
  const userAgent = request.headers.get('user-agent') || ''
  const isSafariBrowser = isSafari(userAgent)
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-subdomain', subdomain)
  requestHeaders.set('x-is-safari', String(isSafariBrowser))
  
  // Create response with modified request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
  
  // Safari fix: Add cache control headers for authenticated pages
  if (isSafariBrowser && request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  // Handle superadmin routes
  if (request.nextUrl.pathname.startsWith('/superadmin')) {
    // Check if user has superadmin role
    const token = request.cookies.get(COOKIE_NAME)?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    try {
      const payload = await verifyToken(token)
      
      if (!payload || payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      
      return response
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  // Don't interfere with API routes (except for subdomain header)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response
  }
  
  // Only protect admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return response
  }
  
  // Allow access to login page
  if (request.nextUrl.pathname === '/admin/login') {
    return response
  }
  
  try {
    // Check for auth cookie
    const token = request.cookies.get(COOKIE_NAME)?.value
    
    if (!token) {
      // Log Safari cookie issues
      if (isSafariBrowser) {
        console.log('[Middleware] Safari detected, no cookie found for path:', request.nextUrl.pathname)
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Verify token
    const payload = await verifyToken(token)
    
    if (!payload || !payload.authenticated) {
      // Log validation failure
      console.log('[Middleware] Token validation failed:', {
        path: request.nextUrl.pathname,
        isSafari: isSafariBrowser,
        tokenPresent: !!token,
        payloadValid: !!payload
      })
      
      // Clear invalid cookie
      const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url))
      redirectResponse.cookies.delete(COOKIE_NAME)
      return redirectResponse
    }
    
    // Add user info to headers
    response.headers.set('x-user-id', payload.userId || '')
    response.headers.set('x-user-role', payload.role || 'admin')
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/api/:path*']
}