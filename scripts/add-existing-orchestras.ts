import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding existing orchestras to central database...')

  // Define the existing orchestras
  const orchestras = [
    {
      name: 'SCO Admin',
      subdomain: 'sco',
      contactName: 'SCO Administrator',
      contactEmail: 'admin@sco.se',
      databaseUrl: process.env.DATABASE_URL_SCO!,
      status: 'active'
    },
    {
      name: 'SCOSO Admin',
      subdomain: 'scoso',
      contactName: 'SCOSO Administrator', 
      contactEmail: 'admin@scoso.se',
      databaseUrl: process.env.DATABASE_URL_SCOSO!,
      status: 'active'
    }
  ]

  for (const orchestraData of orchestras) {
    try {
      // Check if orchestra already exists
      const existing = await prisma.orchestra.findUnique({
        where: { subdomain: orchestraData.subdomain }
      })

      if (existing) {
        console.log(`Orchestra ${orchestraData.subdomain} already exists, updating...`)
        await prisma.orchestra.update({
          where: { subdomain: orchestraData.subdomain },
          data: {
            name: orchestraData.name,
            contactName: orchestraData.contactName,
            contactEmail: orchestraData.contactEmail,
            databaseUrl: orchestraData.databaseUrl,
            status: orchestraData.status
          }
        })
      } else {
        console.log(`Creating orchestra ${orchestraData.subdomain}...`)
        await prisma.orchestra.create({
          data: orchestraData
        })
      }
      
      console.log(`✅ Orchestra ${orchestraData.subdomain} processed successfully`)
    } catch (error) {
      console.error(`❌ Error processing orchestra ${orchestraData.subdomain}:`, error)
    }
  }

  // List all orchestras
  console.log('\nAll orchestras in central database:')
  const allOrchestras = await prisma.orchestra.findMany()
  console.table(allOrchestras.map(o => ({
    name: o.name,
    subdomain: o.subdomain,
    status: o.status,
    hasDatabase: !!o.databaseUrl
  })))
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })