import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Inline getSubdomain to avoid importing database-config which has Prisma
function getSubdomain(hostname: string): string {
  // Handle localhost
  if (hostname.includes('localhost')) {
    return 'localhost'
  }

  // Extract subdomain from hostname
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }

  // Default to admin for main domain
  return 'admin'
}

const COOKIE_NAME = 'orchestra-admin-session'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const hostname = request.headers.get('host') || 'localhost:3001'
  const subdomain = getSubdomain(hostname)
  
  // Add subdomain to request headers for API routes to use
  response.headers.set('x-subdomain', subdomain)
  
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
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Verify token
    const payload = await verifyToken(token)
    
    if (!payload || !payload.authenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
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