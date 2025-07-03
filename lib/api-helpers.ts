import { NextRequest } from 'next/server'
import { getPrismaClient } from './database-config'

/**
 * Get subdomain from request headers (set by middleware)
 */
export function getSubdomainFromRequest(request: NextRequest | Request): string {
  return request.headers.get('x-subdomain') || 'localhost'
}

/**
 * Get Prisma client for the current subdomain
 */
export async function getPrismaForRequest(request: NextRequest | Request) {
  const subdomain = getSubdomainFromRequest(request)
  return getPrismaClient(subdomain)
}

/**
 * Helper to check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}