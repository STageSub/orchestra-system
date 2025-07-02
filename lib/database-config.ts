import { PrismaClient } from '@prisma/client'
import { CustomerService } from './services/customer-service'

// Cache for Prisma clients
const prismaClients: Record<string, PrismaClient> = {}

// Cache for database URLs to avoid async lookups on every request
const databaseUrlCache: Record<string, string> = {}

export async function getDatabaseUrl(subdomain: string): Promise<string> {
  // Check cache first
  if (databaseUrlCache[subdomain]) {
    return databaseUrlCache[subdomain]
  }

  // Special handling for admin and localhost
  if (subdomain === 'admin' || subdomain === 'localhost') {
    const url = process.env.DATABASE_URL!
    databaseUrlCache[subdomain] = url
    return url
  }

  // Try to get from CustomerService
  const customerUrl = await CustomerService.getDatabaseUrl(subdomain)
  if (customerUrl) {
    databaseUrlCache[subdomain] = customerUrl
    return customerUrl
  }

  // Fallback to default database
  console.warn(`No database configuration found for subdomain: ${subdomain}`)
  const defaultUrl = process.env.DATABASE_URL!
  databaseUrlCache[subdomain] = defaultUrl
  return defaultUrl
}

export async function getPrismaClient(subdomain: string): Promise<PrismaClient> {
  // Return cached client if exists
  if (prismaClients[subdomain]) {
    return prismaClients[subdomain]
  }

  // Create new client for this subdomain
  const databaseUrl = await getDatabaseUrl(subdomain)
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  // Cache it
  prismaClients[subdomain] = client
  return client
}

// Get subdomain from hostname
export function getSubdomain(hostname: string): string {
  // Handle localhost
  if (hostname.includes('localhost')) {
    return 'localhost'
  }

  // Extract subdomain from hostname
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }

  // Default to admin for main domain
  return 'admin'
}

// List all configured customers
export async function getConfiguredCustomers(): Promise<string[]> {
  const customers = await CustomerService.getCustomers()
  return customers.map(c => c.subdomain)
}

// Clear caches when customer config changes
export function clearCaches(): void {
  Object.keys(databaseUrlCache).forEach(key => delete databaseUrlCache[key])
  CustomerService.clearCache()
}