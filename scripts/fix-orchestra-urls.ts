import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing orchestra database URLs...\n')

  try {
    // Update SCO to use the correct database URL
    const scoUrl = process.env.DATABASE_URL_SCO
    if (!scoUrl) {
      console.error('DATABASE_URL_SCO not found in environment variables')
      return
    }

    const result = await prisma.$executeRaw`
      UPDATE "Orchestra" 
      SET "databaseUrl" = ${scoUrl}
      WHERE "orchestraId" = 'SCO'
    `
    
    if (result > 0) {
      console.log(`✅ Updated SCO database URL`)
    }

    // Show all orchestras
    const all = await prisma.$queryRaw`
      SELECT "orchestraId", name, "databaseUrl", status FROM "Orchestra" 
      WHERE status = 'active'
      ORDER BY name
    ` as any[]

    console.log('\nActive orchestras with database URLs:')
    all.forEach(o => {
      console.log(`\n${o.orchestraId} - ${o.name}`)
      console.log(`URL: ${o.databaseUrl.substring(0, 50)}...`)
    })

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