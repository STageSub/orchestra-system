import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listOrchestras() {
  try {
    const orchestras = await prisma.orchestra.findMany({
      include: {
        users: true
      }
    })
    
    console.log('Found orchestras:', orchestras.length)
    orchestras.forEach(o => {
      console.log(`- ${o.name} (${o.subdomain}) - Status: ${o.status}, Users: ${o.users.length}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listOrchestras()