import { PrismaClient } from '@prisma/client'
import { CustomerService } from './services/customer-service'

// Cache for Prisma clients
const prismaClients: Record<string, PrismaClient> = {}

// Cache for database URLs to avoid async lookups on every request
const databaseUrlCache: Record<string, string> = {}

export async function getDatabaseUrl(subdomain: string): Promise<string> {
  // Normalize subdomain to lowercase for consistency
  const normalizedSubdomain = subdomain.toLowerCase()
  
  // Check cache first
  if (databaseUrlCache[normalizedSubdomain]) {
    return databaseUrlCache[normalizedSubdomain]
  }

  // Special handling for admin and localhost
  if (normalizedSubdomain === 'admin' || normalizedSubdomain === 'localhost') {
    const url = process.env.DATABASE_URL!
    databaseUrlCache[normalizedSubdomain] = url
    return url
  }

  // Try environment variable first (for testing without Customer table)
  const envVarName = `DATABASE_URL_${normalizedSubdomain.toUpperCase()}`
  const envUrl = process.env[envVarName]
  if (envUrl) {
    console.log(`Using database URL from ${envVarName} for subdomain: ${normalizedSubdomain}`)
    databaseUrlCache[normalizedSubdomain] = envUrl
    return envUrl
  }

  // Try to get from CustomerService (only if Customer table exists)
  try {
    const customerUrl = await CustomerService.getDatabaseUrl(normalizedSubdomain)
    if (customerUrl) {
      databaseUrlCache[normalizedSubdomain] = customerUrl
      return customerUrl
    }
  } catch (error) {
    console.warn(`CustomerService not available: ${error}`)
  }

  // Try to get from Orchestra table
  try {
    console.log(`Looking up orchestra in Neon for subdomain: ${normalizedSubdomain}`)
    const mainPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL!
        }
      }
    })
    
    const orchestra = await mainPrisma.orchestra.findUnique({
      where: { subdomain: normalizedSubdomain },
      select: { databaseUrl: true, name: true, status: true }
    })
    
    console.log(`Orchestra lookup result:`, orchestra ? { name: orchestra.name, status: orchestra.status, hasDatabaseUrl: !!orchestra.databaseUrl } : 'Not found')
    
    if (orchestra?.databaseUrl) {
      console.log(`Found database URL for ${normalizedSubdomain} in Orchestra table`)
      databaseUrlCache[normalizedSubdomain] = orchestra.databaseUrl
      return orchestra.databaseUrl
    }
  } catch (error) {
    console.warn(`Orchestra lookup failed: ${error}`)
  }

  // Fallback to default database
  console.warn(`No database configuration found for subdomain: ${normalizedSubdomain}`)
  const defaultUrl = process.env.DATABASE_URL!
  databaseUrlCache[normalizedSubdomain] = defaultUrl
  return defaultUrl
}

export async function getPrismaClient(subdomain: string): Promise<PrismaClient> {
  // Normalize subdomain to lowercase for consistency
  const normalizedSubdomain = subdomain.toLowerCase()
  
  console.log(`=== getPrismaClient Debug ===`)
  console.log(`Requested subdomain: "${subdomain}"`)
  console.log(`Normalized subdomain: "${normalizedSubdomain}"`)
  
  // Return cached client if exists
  if (prismaClients[normalizedSubdomain]) {
    console.log(`Returning cached client for ${normalizedSubdomain}`)
    return prismaClients[normalizedSubdomain]
  }

  console.log(`Creating new client for ${normalizedSubdomain}`)
  
  // Create new client for this subdomain
  const databaseUrl = await getDatabaseUrl(normalizedSubdomain)
  console.log(`Database URL for ${normalizedSubdomain}: ${databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'NOT FOUND'}`)
  
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Cache it with normalized subdomain
  prismaClients[normalizedSubdomain] = client
  console.log(`Client created and cached for ${normalizedSubdomain}`)
  
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

// Get subdomain from a Prisma client instance
export function getSubdomainFromPrismaClient(prisma: PrismaClient): string | null {
  // Check cached clients to find which subdomain this client belongs to
  for (const [subdomain, client] of Object.entries(prismaClients)) {
    if (client === prisma) {
      // Return the normalized (lowercase) subdomain
      return subdomain.toLowerCase()
    }
  }
  return null
}

// Graceful shutdown for all prisma clients
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    await Promise.all(
      Object.values(prismaClients).map(client => client.$disconnect())
    )
  })
}