import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupFailedOrchestra() {
  try {
    // Find the orchestra created with subdomain 'babalisk'
    const orchestra = await prisma.orchestra.findUnique({
      where: { subdomain: 'babalisk' }
    })
    
    if (orchestra) {
      console.log('Found orchestra:', orchestra.name)
      
      // Delete associated users first
      const deletedUsers = await prisma.user.deleteMany({
        where: { orchestraId: orchestra.id }
      })
      console.log(`Deleted ${deletedUsers.count} associated users`)
      
      // Delete the orchestra
      await prisma.orchestra.delete({
        where: { id: orchestra.id }
      })
      console.log('Orchestra deleted successfully')
    } else {
      console.log('No orchestra found with subdomain "babalisk"')
    }
  } catch (error) {
    console.error('Error cleaning up orchestra:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupFailedOrchestra()