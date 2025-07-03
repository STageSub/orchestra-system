import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupPendingOrchestras() {
  try {
    // Find all pending orchestras without databases
    const pendingOrchestras = await prisma.orchestra.findMany({
      where: {
        AND: [
          { status: 'pending' },
          { databaseUrl: null }
        ]
      },
      include: {
        users: true
      }
    })
    
    console.log(`Found ${pendingOrchestras.length} pending orchestras to clean up`)
    
    for (const orchestra of pendingOrchestras) {
      console.log(`\nProcessing: ${orchestra.name} (${orchestra.subdomain})`)
      
      // Delete associated users first
      if (orchestra.users.length > 0) {
        const deletedUsers = await prisma.user.deleteMany({
          where: { orchestraId: orchestra.id }
        })
        console.log(`  - Deleted ${deletedUsers.count} users`)
      }
      
      // Delete the orchestra
      await prisma.orchestra.delete({
        where: { id: orchestra.id }
      })
      console.log(`  - Orchestra deleted`)
    }
    
    // Show remaining orchestras
    const remaining = await prisma.orchestra.findMany({
      select: {
        name: true,
        subdomain: true,
        status: true,
        databaseUrl: true
      }
    })
    
    console.log('\nRemaining orchestras:')
    console.log('====================')
    for (const o of remaining) {
      console.log(`- ${o.name} (${o.subdomain}) - Status: ${o.status}, Database: ${o.databaseUrl ? 'Yes' : 'No'}`)
    }
    
  } catch (error) {
    console.error('Error cleaning up orchestras:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupPendingOrchestras()