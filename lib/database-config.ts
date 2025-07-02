import { PrismaClient } from '@prisma/client'

// Map of customer subdomains to database URLs
const DATABASE_URLS: Record<string, string> = {
  // Example customers - replace with actual database URLs
  'goteborg': process.env.DATABASE_URL_GOTEBORG || process.env.DATABASE_URL!,
  'malmo': process.env.DATABASE_URL_MALMO || process.env.DATABASE_URL!,
  'stockholm': process.env.DATABASE_URL_STOCKHOLM || process.env.DATABASE_URL!,
  // Default/admin database
  'admin': process.env.DATABASE_URL!,
  'localhost': process.env.DATABASE_URL!,
}

// Cache for Prisma clients
const prismaClients: Record<string, PrismaClient> = {}

export function getDatabaseUrl(subdomain: string): string {
  return DATABASE_URLS[subdomain] || process.env.DATABASE_URL!
}

export function getPrismaClient(subdomain: string): PrismaClient {
  // Return cached client if exists
  if (prismaClients[subdomain]) {
    return prismaClients[subdomain]
  }

  // Create new client for this subdomain
  const databaseUrl = getDatabaseUrl(subdomain)
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
export function getConfiguredCustomers(): string[] {
  return Object.keys(DATABASE_URLS).filter(
    subdomain => subdomain !== 'admin' && subdomain !== 'localhost'
  )
}