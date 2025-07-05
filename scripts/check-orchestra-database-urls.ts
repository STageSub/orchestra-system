import { PrismaClient } from '@prisma/client'

async function checkOrchestraDatabaseUrls() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })

  try {
    const orchestras = await prisma.orchestra.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        databaseUrl: true,
        status: true,
      }
    })
    
    console.log('Orchestra database URLs:')
    orchestras.forEach(o => {
      console.log(`- ${o.name} (${o.subdomain}):`)
      console.log(`  ID: ${o.id}`)
      console.log(`  Status: ${o.status}`)
      console.log(`  Database URL: ${o.databaseUrl ? 'SET' : 'NOT SET'}`)
      if (o.databaseUrl) {
        // Don't log full URL for security, just the host
        const url = new URL(o.databaseUrl)
        console.log(`  Database Host: ${url.hostname}`)
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrchestraDatabaseUrls()