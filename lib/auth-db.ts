import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { isSafari, safariCookieDelay } from './safari-utils'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

const COOKIE_NAME = 'orchestra-admin-session'

interface TokenPayload {
  authenticated: boolean
  userId: string
  username: string
  role: string
  orchestraId?: string
  subdomain?: string
  exp: number
}

interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: string
  orchestraId?: string | null
  active: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(user: User, subdomain?: string): Promise<string> {
  const token = await new SignJWT({ 
    authenticated: true,
    userId: user.id,
    username: user.username,
    role: user.role,
    orchestraId: user.orchestraId || undefined,
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
  const isProduction = process.env.NODE_ENV === 'production'
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // Use 'lax' for Safari compatibility
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })
}

export async function getAuthCookie(retryCount = 0): Promise<string | undefined> {
  console.log('[getAuthCookie] Getting cookie:', COOKIE_NAME, 'retry:', retryCount)
  
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    console.log('[getAuthCookie] Cookie found:', cookie ? 'yes' : 'no')
    
    // If no cookie found and this is Safari, retry once after a delay
    if (!cookie && retryCount === 0) {
      console.log('[getAuthCookie] No cookie found, retrying after delay...')
      await safariCookieDelay()
      return getAuthCookie(1)
    }
    
    return cookie?.value
  } catch (error) {
    console.error('[getAuthCookie] Error accessing cookies:', error)
    // Return undefined instead of throwing
    return undefined
  }
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'
  
  console.log('[removeAuthCookie] Clearing cookie for Safari compatibility')
  
  // Safari fix: Multiple approaches to ensure cookie is cleared
  // 1. Set to empty value with immediate expiration
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // Match the same sameSite as when setting
    maxAge: -1, // Negative value to ensure deletion
    expires: new Date(0), // January 1, 1970
    path: '/',
    // Add domain for production to match set cookie
    ...(isProduction && { domain: '.stagesub.com' })
  })
  
  // 2. Also explicitly delete
  cookieStore.delete(COOKIE_NAME)
  
  // 3. Try one more time with different approach for Safari
  cookieStore.set(COOKIE_NAME, 'deleted', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    ...(isProduction && { domain: '.stagesub.com' })
  })
}

export async function getCurrentUser(request?: Request): Promise<User | null> {
  try {
    console.log('[getCurrentUser] Starting...')
    
    // Check if this is a Safari request
    const userAgent = request?.headers.get('user-agent') || ''
    const isSafariBrowser = isSafari(userAgent)
    console.log('[getCurrentUser] User agent:', userAgent.substring(0, 50), 'Safari:', isSafariBrowser)
    
    let token
    try {
      token = await getAuthCookie()
      console.log('[getCurrentUser] Token from cookie:', token ? `${token.substring(0, 20)}...` : 'null')
    } catch (error) {
      console.error('[getCurrentUser] Error getting cookie:', error)
      return null
    }
    
    if (!token) {
      console.log('[getCurrentUser] No token found in cookie')
      return null
    }
    
    let payload
    try {
      payload = await verifyToken(token)
      console.log('[getCurrentUser] Token payload:', payload ? { userId: payload.userId, authenticated: payload.authenticated } : 'null')
    } catch (error) {
      console.error('[getCurrentUser] Error verifying token:', error)
      return null
    }
    
    if (!payload || !payload.userId) {
      console.log('[getCurrentUser] Invalid payload or missing userId')
      return null
    }
  
  try {
    // Create a local Prisma instance for the central database
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    })
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    await prisma.$disconnect()
    
    if (!user || !user.active) return null
    
    return user
  } catch (error) {
    // If User table doesn't exist yet, return null
    console.error('Error fetching user:', error)
    return null
  }
  } catch (error) {
    console.error('[getCurrentUser] Unexpected error:', error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    console.log(`[authenticateUser] Attempting login for username: ${username}`)
    
    // Create a local Prisma instance for authentication
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    })
    
    const user = await prisma.user.findUnique({
      where: { username },
      include: { orchestra: true }
    })
    
    console.log(`[authenticateUser] User found:`, user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      orchestraId: user.orchestraId,
      orchestraName: (user as any).orchestra?.name,
      active: user.active,
      hasPasswordHash: !!user.passwordHash
    } : 'Not found')
    
    if (!user || !user.active) {
      console.log(`[authenticateUser] User not found or inactive`)
      await prisma.$disconnect()
      return null
    }
    
    const passwordValid = await verifyPasswordHash(password, user.passwordHash)
    console.log(`[authenticateUser] Password verification:`, passwordValid ? 'Valid' : 'Invalid')
    
    if (!passwordValid) {
      await prisma.$disconnect()
      return null
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
    
    await prisma.$disconnect()
    
    console.log(`[authenticateUser] Login successful for ${username}`)
    return user
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Backward compatibility functions
export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set in environment variables')
    return false
  }
  
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

// Migration helper to create initial superadmin user
export async function createSuperadminUser(): Promise<void> {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    })
    
    const existingSuperadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })
    
    if (existingSuperadmin) {
      console.log('Superadmin user already exists')
      await prisma.$disconnect()
      return
    }
    
    const superadminPassword = process.env.SUPERADMIN_PASSWORD
    if (!superadminPassword) {
      console.error('SUPERADMIN_PASSWORD not set, cannot create superadmin user')
      await prisma.$disconnect()
      return
    }
    
    const passwordHash = await hashPassword(superadminPassword)
    
    await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@stagesub.com',
        passwordHash,
        role: 'superadmin',
        active: true
      }
    })
    
    await prisma.$disconnect()
    
    console.log('Superadmin user created successfully')
  } catch (error) {
    console.error('Error creating superadmin user:', error)
  }
}