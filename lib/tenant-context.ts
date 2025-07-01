import { AsyncLocalStorage } from 'async_hooks'

// AsyncLocalStorage for tenant context
const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>()

// Set the current tenant for the request
export function runWithTenant<T>(tenantId: string, callback: () => T): T {
  return tenantStorage.run({ tenantId }, callback)
}

// Get the current tenant ID
export function getCurrentTenant(): string | undefined {
  const store = tenantStorage.getStore()
  return store?.tenantId
}

// Middleware to extract tenant from subdomain or headers
export function getTenantFromRequest(request: Request): string | null {
  const url = new URL(request.url)
  const hostname = url.hostname

  // Extract subdomain
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    // Format: tenant.stagesub.com or tenant.localhost:3000
    return parts[0]
  }

  // Check for tenant header (useful for API calls)
  const tenantHeader = request.headers.get('x-tenant-id')
  if (tenantHeader) {
    return tenantHeader
  }

  // Default tenant for development
  if (process.env.NODE_ENV === 'development') {
    return 'default-tenant'
  }

  return null
}