import { PrismaClient } from '@prisma/client'
import { PrismaClient as CentralPrismaClient } from '../node_modules/.prisma/client-central'
import { cookies } from 'next/headers'
import { verifyToken } from './auth-db'
import { getPrismaClient } from './database-config'

// Global singleton for Neon (main database)
const globalForNeonPrisma = globalThis as unknown as {
  neonPrisma: CentralPrismaClient | undefined
}

// Neon prisma för auth och Orchestra/User tabeller
const neonPrisma = globalForNeonPrisma.neonPrisma ?? new CentralPrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForNeonPrisma.neonPrisma = neonPrisma
}

/**
 * Get the current subdomain from auth token
 */
// Cache för subdomain lookups
const subdomainCache = new Map<string, { subdomain: string | null; expires: number }>()

async function getCurrentSubdomain(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('orchestra-admin-session')?.value
    
    if (!token) {
      return null
    }
    
    // Check cache first
    const cached = subdomainCache.get(token)
    if (cached && cached.expires > Date.now()) {
      return cached.subdomain
    }
    
    const payload = await verifyToken(token)
    
    if (!payload?.userId) {
      return null
    }
    
    // Om användaren har orchestraId, hämta subdomain
    if (payload.orchestraId) {
      const orchestra = await (neonPrisma as any).orchestra.findUnique({
        where: { id: payload.orchestraId },
        select: { subdomain: true }
      })
      
      const subdomain = orchestra?.subdomain || null
      
      // Cache for 5 minutes
      subdomainCache.set(token, {
        subdomain,
        expires: Date.now() + 5 * 60 * 1000
      })
      
      return subdomain
    }
    
    return null
  } catch (error) {
    // Only log real errors, not expected ones
    if (error instanceof Error && !error.message.includes('cookies')) {
      console.error('Error getting current subdomain:', error)
    }
    return null
  }
}

/**
 * Get the correct Prisma instance based on current auth context
 * This function automatically routes to the correct database
 */
export async function getPrisma(): Promise<PrismaClient> {
  const subdomain = await getCurrentSubdomain()
  
  // Om ingen subdomain (t.ex. inte inloggad eller superadmin), använd Neon
  if (!subdomain) {
    // Logga bara i development för att undvika spam
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Neon database (no subdomain)')
    }
    return neonPrisma
  }
  
  // Använd getPrismaClient från database-config som redan har caching
  if (process.env.NODE_ENV === 'development') {
    console.log(`Using database for subdomain: ${subdomain}`)
  }
  return await getPrismaClient(subdomain)
}

// Export neonPrisma för speciella fall där vi explicit vill använda huvuddatabasen
export { neonPrisma }

// Export getCurrentSubdomain for cases where we need to know which orchestra we're in
export { getCurrentSubdomain }