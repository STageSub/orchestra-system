import { PrismaClient } from '@prisma/client'

async function checkNeonData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })

  try {
    console.log('Checking Neon database...')
    
    // Check orchestras
    const orchestras = await prisma.orchestra.findMany()
    console.log(`\nFound ${orchestras.length} orchestras:`)
    orchestras.forEach(o => {
      console.log(`- ${o.name} (${o.orchestraId}) - Status: ${o.status}`)
    })
    
    // Check users
    const users = await prisma.user.findMany()
    console.log(`\nFound ${users.length} users:`)
    users.forEach(u => {
      console.log(`- ${u.username} (${u.role}) - Orchestra: ${u.orchestraId || 'none'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNeonData()