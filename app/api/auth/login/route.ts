import { NextRequest, NextResponse } from 'next/server'
import { createToken, setAuthCookie, verifyPassword, verifySuperadminPassword } from '@/lib/auth'
import { authenticateUser, createToken as createDbToken, removeAuthCookie } from '@/lib/auth-db'
import { setAuthCookieOnResponse } from '@/lib/auth-cookie-fix'
import { logger } from '@/lib/logger'
import { isSafari } from '@/lib/user-agent'

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
    const userAgent = request.headers.get('user-agent')
    const isSafariBrowser = isSafari(userAgent)
    
    // Safari fix: Clear any existing cookies before login
    if (isSafariBrowser) {
      console.log('[login] Safari detected, clearing existing cookies first')
      await removeAuthCookie()
      // Small delay to ensure cookie is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      await logger.warn('auth', 'Rate limit exceeded for login attempts', {
        metadata: {
          ip,
          attempts: loginAttempts.get(ip)?.count || 0
        }
      })
      return NextResponse.json(
        { error: 'För många inloggningsförsök. Försök igen om 15 minuter.' },
        { status: 429 }
      )
    }
    
    const { username, password, loginType = 'admin' } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Lösenord krävs' },
        { status: 400 }
      )
    }
    
    // No subdomains used in this system
    const subdomain = undefined
    
    let token: string
    let role = 'admin'
    
    // Check if using new database authentication (username provided)
    if (username) {
      // New authentication system
      const user = await authenticateUser(username, password)
      
      if (!user) {
        await logger.warn('auth', 'Failed login attempt - invalid credentials', {
          metadata: {
            username,
            ip,
            loginType: 'database'
          }
        })
        return NextResponse.json(
          { error: 'Fel användarnamn eller lösenord' },
          { status: 401 }
        )
      }
      
      // Create JWT token with user info
      token = await createDbToken(user, subdomain)
      role = user.role
    } else {
      // Old authentication system (password only)
      let isValid = false
      
      if (loginType === 'superadmin') {
        isValid = await verifySuperadminPassword(password)
        role = 'superadmin'
      } else {
        isValid = await verifyPassword(password)
        role = 'admin'
      }
      
      if (!isValid) {
        await logger.warn('auth', 'Failed login attempt - invalid password', {
          metadata: {
            ip,
            loginType
          }
        })
        return NextResponse.json(
          { error: 'Fel lösenord' },
          { status: 401 }
        )
      }
      
      // Create JWT token with role and subdomain
      token = await createToken(undefined, role, subdomain)
    }
    
    // Reset login attempts on successful login
    loginAttempts.delete(ip)
    
    // Log successful login
    await logger.info('auth', 'User logged in successfully', {
      metadata: {
        username: username || 'legacy-admin',
        role,
        ip,
        loginType: username ? 'database' : loginType
      }
    })
    
    // Create response with cookie
    const response = NextResponse.json({ success: true, role })
    
    // Use improved cookie setting for production
    setAuthCookieOnResponse(response, token, process.env.NODE_ENV === 'production')
    
    // Safari fix: Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Add debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Login successful:', { username, role, isSafari: isSafariBrowser })
    }
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    
    // Log error
    await logger.error('auth', `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        ip: getClientIp(request)
      }
    })
    
    // More detailed error in development
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { 
          error: 'Ett fel uppstod vid inloggning',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid inloggning' },
      { status: 500 }
    )
  }
}