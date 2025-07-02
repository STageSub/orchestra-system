import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from './database-config'

// Helper to get Prisma client based on subdomain from request headers
export async function getPrismaFromHeaders(headers: Headers): Promise<PrismaClient> {
  const subdomain = headers.get('x-subdomain') || 'localhost'
  return await getPrismaClient(subdomain)
}

// Export a default client for non-request contexts (like scripts)
// Note: This is initialized lazily on first use
let defaultPrisma: PrismaClient | null = null

export async function getDefaultPrisma(): Promise<PrismaClient> {
  if (!defaultPrisma) {
    defaultPrisma = await getPrismaClient('localhost')
  }
  return defaultPrisma
}

// For backward compatibility where prisma is used directly
// This will be deprecated - use getDefaultPrisma() instead
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
})