import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('Updating orchestras with correct database URLs...\n')

  try {
    // First, let's add SCO and SCOSO orchestras
    const orchestrasToAdd = [
      {
        orchestraId: 'SCO',
        name: 'SCO Admin',
        subdomain: 'sco',
        databaseUrl: process.env.DATABASE_URL_SCO!,
        status: 'active'
      },
      {
        orchestraId: 'SCOSO',
        name: 'SCOSO Admin',
        subdomain: 'scoso',
        databaseUrl: process.env.DATABASE_URL_SCOSO!,
        status: 'active'
      }
    ]

    for (const orchestra of orchestrasToAdd) {
      const existing = await prisma.$queryRaw`
        SELECT * FROM "Orchestra" WHERE subdomain = ${orchestra.subdomain}
      `
      
      if ((existing as any[]).length > 0) {
        console.log(`Orchestra ${orchestra.subdomain} already exists, updating...`)
        await prisma.$executeRaw`
          UPDATE "Orchestra" 
          SET "databaseUrl" = ${orchestra.databaseUrl},
              "name" = ${orchestra.name},
              "status" = ${orchestra.status}
          WHERE subdomain = ${orchestra.subdomain}
        `
      } else {
        console.log(`Creating orchestra ${orchestra.subdomain}...`)
        await prisma.$executeRaw`
          INSERT INTO "Orchestra" ("id", "orchestraId", "name", "subdomain", "databaseUrl", "status", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${orchestra.orchestraId}, ${orchestra.name}, ${orchestra.subdomain}, ${orchestra.databaseUrl}, ${orchestra.status}, NOW(), NOW())
        `
      }
    }

    // Update the test orchestras if they have environment variables
    const updates = [
      { subdomain: 'goteborg', envVar: 'DATABASE_URL_GOTEBORG' },
      { subdomain: 'stockholm', envVar: 'DATABASE_URL_STOCKHOLM' },
      { subdomain: 'malmo', envVar: 'DATABASE_URL_MALMO' }
    ]

    for (const update of updates) {
      const dbUrl = process.env[update.envVar]
      if (dbUrl) {
        console.log(`Updating ${update.subdomain} with real database URL`)
        await prisma.$executeRaw`
          UPDATE "Orchestra" 
          SET "databaseUrl" = ${dbUrl}
          WHERE subdomain = ${update.subdomain}
        `
      }
    }

    // Show all orchestras
    const allOrchestras = await prisma.$queryRaw`SELECT * FROM "Orchestra" ORDER BY subdomain`
    console.log('\nAll orchestras in database:')
    console.table((allOrchestras as any[]).map(o => ({
      id: o.orchestraId,
      name: o.name,
      subdomain: o.subdomain,
      status: o.status,
      hasRealDB: !o.databaseUrl.includes('dummy')
    })))

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