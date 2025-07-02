import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

const COOKIE_NAME = 'orchestra-admin-session'

interface TokenPayload {
  authenticated: boolean
  userId?: string
  role?: string
  subdomain?: string
  exp: number
}

export async function createToken(userId?: string, role?: string, subdomain?: string): Promise<string> {
  const token = await new SignJWT({ 
    authenticated: true,
    userId,
    role,
    subdomain
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch (error) {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie()
  if (!token) return false
  
  const payload = await verifyToken(token)
  return payload !== null && payload.authenticated === true
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set in environment variables')
    return false
  }
  
  // For simplicity, we'll do a direct comparison
  // In a more complex system, you'd hash the stored password
  return password === adminPassword
}

export async function verifySuperadminPassword(password: string): Promise<boolean> {
  const superadminPassword = process.env.SUPERADMIN_PASSWORD
  
  if (!superadminPassword) {
    console.error('SUPERADMIN_PASSWORD not set in environment variables')
    return false
  }
  
  return password === superadminPassword
}