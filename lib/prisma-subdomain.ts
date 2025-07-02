import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from './database-config'

// Helper to get Prisma client based on subdomain from request headers
export function getPrismaFromHeaders(headers: Headers): PrismaClient {
  const subdomain = headers.get('x-subdomain') || 'localhost'
  return getPrismaClient(subdomain)
}

// Export a default client for non-request contexts (like scripts)
export const prisma = getPrismaClient('localhost')