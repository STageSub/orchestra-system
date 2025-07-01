import { PrismaClient, Prisma } from '@prisma/client'
import { getCurrentTenant } from './tenant-context'

const globalForPrisma = globalThis as unknown as {
  prismaMultitenant: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'pretty',
  })

  // Add middleware for automatic tenant filtering
  prisma.$use(async (params, next) => {
    const tenantId = getCurrentTenant()
    
    // Skip tenant filtering for User and Tenant models
    if (!tenantId || params.model === 'User' || params.model === 'Tenant') {
      return next(params)
    }

    // Models that don't have tenantId (child models that inherit through relations)
    const modelsWithoutTenantId = [
      'MusicianQualification',
      'Ranking',
      'Request',
      'RequestToken',
      'CommunicationLog',
      'ProjectFile',
      'ProjectNeed'
    ]

    if (modelsWithoutTenantId.includes(params.model || '')) {
      return next(params)
    }

    // Add tenant filter to all queries
    if (params.action === 'findFirst' || params.action === 'findUnique') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
    }

    if (params.action === 'findMany') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
    }

    if (params.action === 'update' || params.action === 'delete') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
    }

    if (params.action === 'updateMany' || params.action === 'deleteMany') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
    }

    if (params.action === 'create') {
      params.args = params.args || {}
      params.args.data = {
        ...params.args.data,
        tenantId
      }
    }

    if (params.action === 'createMany') {
      params.args = params.args || {}
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          tenantId
        }))
      } else {
        params.args.data = {
          ...params.args.data,
          tenantId
        }
      }
    }

    if (params.action === 'upsert') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
      params.args.create = {
        ...params.args.create,
        tenantId
      }
      params.args.update = {
        ...params.args.update,
        tenantId
      }
    }

    if (params.action === 'aggregate' || params.action === 'groupBy' || params.action === 'count') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        tenantId
      }
    }

    return next(params)
  })

  return prisma
}

export const prismaMultitenant = globalForPrisma.prismaMultitenant ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaMultitenant = prismaMultitenant

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    await prismaMultitenant.$disconnect()
  })
}

// Export a function to get Prisma client with tenant context
export async function getPrismaClient(tenantId?: string) {
  if (!tenantId) {
    return prismaMultitenant
  }

  // For dedicated database support in the future
  const tenant = await prismaMultitenant.tenant.findUnique({
    where: { id: tenantId }
  })

  if (tenant?.databaseType === 'dedicated' && tenant.databaseUrl) {
    // Return a new PrismaClient instance with dedicated database URL
    return new PrismaClient({
      datasources: {
        db: {
          url: tenant.databaseUrl
        }
      }
    })
  }

  return prismaMultitenant
}