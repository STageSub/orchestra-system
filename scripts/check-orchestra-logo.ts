import { PrismaClient } from '@prisma/client'

async function checkOrchestraLogo() {
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
        name: true,
        subdomain: true,
        logoUrl: true,
      }
    })
    
    console.log('Orchestra logos:')
    orchestras.forEach(o => {
      console.log(`- ${o.name} (${o.subdomain}): ${o.logoUrl ? 'Has logo' : 'No logo'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrchestraLogo()