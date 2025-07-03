import { PrismaClient } from '@prisma/client'

async function markMigrationResolved() {
  const databaseUrl = process.argv[2]
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL krävs')
    process.exit(1)
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    // Mark the failed migration as resolved
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET "finished_at" = NOW(),
          "logs" = NULL
      WHERE "migration_name" = '20250627170040_make_display_order_required'
      AND "finished_at" IS NULL
    `
    
    console.log('✅ Migrering markerad som löst')
    
    // Also update displayOrder to be required
    await prisma.$executeRaw`
      UPDATE "Instrument" 
      SET "displayOrder" = 999 
      WHERE "displayOrder" IS NULL
    `
    
    console.log('✅ DisplayOrder uppdaterad')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

markMigrationResolved()