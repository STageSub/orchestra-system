import { NextRequest, NextResponse } from 'next/server'
import { createToken, setAuthCookie, verifyPassword, verifySuperadminPassword } from '@/lib/auth'
import { getSubdomain } from '@/lib/database-config'

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
    
    const { password, loginType = 'admin' } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Lösenord krävs' },
        { status: 400 }
      )
    }
    
    // Get subdomain
    const hostname = request.headers.get('host') || 'localhost:3001'
    const subdomain = getSubdomain(hostname)
    
    // Verify password based on login type
    let isValid = false
    let role = 'admin'
    
    if (loginType === 'superadmin') {
      isValid = await verifySuperadminPassword(password)
      role = 'superadmin'
    } else {
      isValid = await verifyPassword(password)
      role = 'admin'
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Fel lösenord' },
        { status: 401 }
      )
    }
    
    // Create JWT token with role and subdomain
    const token = await createToken(undefined, role, subdomain)
    
    // Reset login attempts on successful login
    loginAttempts.delete(ip)
    
    // Create response with cookie
    const response = NextResponse.json({ success: true, role })
    
    // Set cookie directly in the response
    response.cookies.set('orchestra-admin-session', token, {
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