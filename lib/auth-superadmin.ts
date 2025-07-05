import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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
    const cookieStore = await cookies()
    const token = cookieStore.get('orchestra-admin-session')?.value

    if (!token) {
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