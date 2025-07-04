import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

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
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return { authorized: false }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
    
    // Check if user is superadmin
    if (decoded.role !== 'superadmin') {
      return { authorized: false }
    }

    return { authorized: true, user: decoded }
  } catch (error) {
    console.error('Auth error:', error)
    return { authorized: false }
  }
}