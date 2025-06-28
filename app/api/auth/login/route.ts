import { NextRequest, NextResponse } from 'next/server'
import { createToken, setAuthCookie, verifyPassword } from '@/lib/auth'

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
    
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Lösenord krävs' },
        { status: 400 }
      )
    }
    
    // Verify password
    const isValid = await verifyPassword(password)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Fel lösenord' },
        { status: 401 }
      )
    }
    
    // Create JWT token
    const token = await createToken()
    
    // Reset login attempts on successful login
    loginAttempts.delete(ip)
    
    // Create response with cookie
    const response = NextResponse.json({ success: true })
    
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