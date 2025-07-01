import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth-edge'
import { authenticateUser } from '@/lib/auth-node'
import { getTenantFromRequest } from '@/lib/tenant-context'

// Rate limiting: Track login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  
  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 minutes
    return true
  }
  
  if (attempt.count >= 5) {
    return false
  }
  
  attempt.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'För många inloggningsförsök. Försök igen om 15 minuter.' },
        { status: 429 }
      )
    }
    
    const { email, password } = await request.json()
    
    // Get tenant from subdomain
    const tenantId = getTenantFromRequest(request as unknown as Request)
    
    // Support legacy password-only login for backward compatibility
    if (!email && password) {
      // Legacy login - verify against ADMIN_PASSWORD
      const isValid = await verifyPassword(password)
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Fel lösenord' },
          { status: 401 }
        )
      }
      
      // For legacy login, use the admin user we just created
      const authResult = await authenticateUser('admin@orchestra.local', password, 'default-tenant')
      
      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        )
      }
      
      // Reset login attempts on successful login
      loginAttempts.delete(ip)
      
      // Create response with cookie
      const response = NextResponse.json({ 
        success: true,
        user: authResult.user 
      })
      
      // Set cookie directly in the response
      response.cookies.set('orchestra-admin-session', authResult.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })
      
      return response
    }
    
    // New multi-tenant login
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email och lösenord krävs' },
        { status: 400 }
      )
    }
    
    // Authenticate user - don't pass tenantId for email login to allow flexible auth
    const authResult = await authenticateUser(email, password)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }
    
    // Reset login attempts on successful login
    loginAttempts.delete(ip)
    
    // Create response with cookie
    const response = NextResponse.json({ 
      success: true,
      user: authResult.user 
    })
    
    // Set cookie directly in the response
    response.cookies.set('orchestra-admin-session', authResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid inloggning' },
      { status: 500 }
    )
  }
}