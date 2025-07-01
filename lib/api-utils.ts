import { NextRequest, NextResponse } from 'next/server'
import { runWithTenant } from './tenant-context'
import { prismaMultitenant } from './prisma-multitenant'

// Wrapper for API routes to handle tenant context
export function withTenant<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<R> => {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      ) as R
    }

    // Verify tenant exists
    try {
      const tenant = await prismaMultitenant.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        return NextResponse.json(
          { error: 'Invalid tenant' },
          { status: 400 }
        ) as R
      }

      // Run handler with tenant context
      return runWithTenant(tenantId, () => handler(request, ...args))
    } catch (error) {
      console.error('Tenant verification error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as R
    }
  }
}

// Helper to get tenant ID from request
export function getTenantId(request: NextRequest): string | null {
  return request.headers.get('x-tenant-id')
}

// Helper to get user ID from request
export function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}