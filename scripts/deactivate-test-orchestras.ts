import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('Deactivating test orchestras...\n')

  try {
    // Deactivate test orchestras (keep only SCO and SCOSO active)
    const testOrchestras = ['goteborg', 'stockholm', 'malmo', 'uppsala']
    
    for (const subdomain of testOrchestras) {
      const result = await prisma.$executeRaw`
        UPDATE "Orchestra" 
        SET status = 'inactive'
        WHERE subdomain = ${subdomain}
      `
      if (result > 0) {
        console.log(`✅ Deactivated orchestra: ${subdomain}`)
      }
    }

    // Show all orchestras
    const all = await prisma.$queryRaw`
      SELECT "orchestraId", name, subdomain, status FROM "Orchestra" 
      ORDER BY status DESC, name
    ` as any[]

    console.log('\nAll orchestras:')
    console.table(all.map(o => ({
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