import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up test orchestras...\n')

  try {
    // Delete test orchestras (keep only SCO and SCOSO)
    const testOrchestras = ['goteborg', 'stockholm', 'malmo', 'uppsala']
    
    // First delete related OrchestraMetrics
    for (const subdomain of testOrchestras) {
      const deleteMetrics = await prisma.$executeRaw`
        DELETE FROM "OrchestraMetrics" 
        WHERE "orchestraId" IN (
          SELECT "orchestraId" FROM "Orchestra" WHERE subdomain = ${subdomain}
        )
      `
      if (deleteMetrics > 0) {
        console.log(`  Deleted ${deleteMetrics} metrics for ${subdomain}`)
      }
    }
    
    // Then delete the orchestras
    for (const subdomain of testOrchestras) {
      const result = await prisma.$executeRaw`
        DELETE FROM "Orchestra" 
        WHERE subdomain = ${subdomain}
      `
      if (result > 0) {
        console.log(`✅ Deleted orchestra: ${subdomain}`)
      }
    }

    // Show remaining orchestras
    const remaining = await prisma.$queryRaw`
      SELECT * FROM "Orchestra" 
      ORDER BY name
    ` as any[]

    console.log('\nRemaining orchestras:')
    console.table(remaining.map(o => ({
      id: o.orchestraId,
      name: o.name,
      subdomain: o.subdomain,
      status: o.status
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