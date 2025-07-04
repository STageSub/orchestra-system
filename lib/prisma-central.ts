import { PrismaClient } from '@prisma/client-central'

declare global {
  var prismaCentral: PrismaClient | undefined
}

// Create a singleton instance of Prisma Client for central database
export const prismaCentral = global.prismaCentral || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prismaCentral = prismaCentral
}

export default prismaCentral