import { NextRequest } from 'next/server'
import { getPrismaFromHeaders } from './prisma-subdomain'

// Helper to get Prisma client from request
export function getPrismaFromRequest(request: NextRequest) {
  return getPrismaFromHeaders(request.headers)
}