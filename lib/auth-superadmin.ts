import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { safariCookieDelay } from './safari-utils'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

interface AuthResult {
  authorized: boolean
  user?: {
    id: string
    email: string
    role: string
  }
}

export async function checkSuperadminAuth(): Promise<AuthResult> {
  try {
    let token: string | undefined
    
    try {
      const cookieStore = await cookies()
      const cookie = cookieStore.get('orchestra-admin-session')
      token = cookie?.value
      
      // Retry once for Safari if no cookie found
      if (!token) {
        await safariCookieDelay()
        const retryCookie = cookieStore.get('orchestra-admin-session')
        token = retryCookie?.value
      }
    } catch (error) {
      console.error('[checkSuperadminAuth] Error accessing cookies:', error)
      return { authorized: false }
    }

    if (!token) {
      console.log('[checkSuperadminAuth] No token found')
      return { authorized: false }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const decoded = payload as any
    
    // Check if user is superadmin
    if (decoded.role !== 'superadmin') {
      return { authorized: false }
    }

    return { 
      authorized: true, 
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email || '',
        role: decoded.role
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { authorized: false }
  }
}