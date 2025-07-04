import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking existing orchestras in database...\n')

  try {
    // Get raw data using queryRaw to see actual columns
    const orchestras = await prisma.$queryRaw`SELECT * FROM "Orchestra"`
    console.log('Orchestra table contents:')
    console.log(orchestras)
    
    // Also check users
    const users = await prisma.$queryRaw`SELECT * FROM "User"`
    console.log('\nUser table contents:')
    console.log(users)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })