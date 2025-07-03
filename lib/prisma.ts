import { PrismaClient } from '@prisma/client'
import { getPrisma as getDynamicPrisma } from './prisma-dynamic'

// Re-export the dynamic getPrisma function
export { getPrisma } from './prisma-dynamic'

// Keep the old prisma export for backward compatibility during migration
// This will always point to the main database (Neon)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
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
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
  })
}