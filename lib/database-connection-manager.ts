import { PrismaClient } from '@prisma/client'
import { prismaMultitenant } from './prisma-multitenant'

// Cache for dedicated database connections
const dedicatedConnections = new Map<string, PrismaClient>()

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  
  private constructor() {}
  
  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }
  
  /**
   * Get a Prisma client for a specific tenant
   */
  async getConnection(tenantId: string): Promise<PrismaClient> {
    // Get tenant info
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      select: { databaseType: true, databaseUrl: true }
    })
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    
    // If shared database, return the multi-tenant client
    if (tenant.databaseType === 'shared') {
      return prismaMultitenant
    }
    
    // If dedicated database, check cache or create new connection
    if (tenant.databaseType === 'dedicated' && tenant.databaseUrl) {
      const cached = dedicatedConnections.get(tenantId)
      if (cached) {
        return cached
      }
      
      // Create new dedicated connection
      const client = new PrismaClient({
        datasources: {
          db: {
            url: tenant.databaseUrl
          }
        },
        log: process.env.NODE_ENV === 'development' 
          ? ['error', 'warn'] 
          : ['error', 'warn'],
      })
      
      // Cache the connection
      dedicatedConnections.set(tenantId, client)
      
      return client
    }
    
    // Default to shared database
    return prismaMultitenant
  }
  
  /**
   * Close a dedicated connection for a tenant
   */
  async closeConnection(tenantId: string): Promise<void> {
    const client = dedicatedConnections.get(tenantId)
    if (client) {
      await client.$disconnect()
      dedicatedConnections.delete(tenantId)
    }
  }
  
  /**
   * Close all dedicated connections
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(dedicatedConnections.entries()).map(
      async ([tenantId, client]) => {
        await client.$disconnect()
        dedicatedConnections.delete(tenantId)
      }
    )
    await Promise.all(promises)
  }
  
  /**
   * Get connection stats
   */
  getConnectionStats() {
    return {
      dedicatedConnections: dedicatedConnections.size,
      tenants: Array.from(dedicatedConnections.keys())
    }
  }
}

// Export singleton instance
export const connectionManager = DatabaseConnectionManager.getInstance()

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    await connectionManager.closeAllConnections()
  })
  
  process.on('SIGINT', async () => {
    await connectionManager.closeAllConnections()
  })
}