import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupOrchestra() {
  try {
    // Find the orchestra created with subdomain 'brusk'
    const orchestra = await prisma.orchestra.findUnique({
      where: { subdomain: 'brusk' }
    })
    
    if (orchestra) {
      console.log('Found orchestra:', orchestra.name)
      
      // Delete associated users first
      await prisma.user.deleteMany({
        where: { orchestraId: orchestra.id }
      })
      console.log('Deleted associated users')
      
      // Delete the orchestra
      await prisma.orchestra.delete({
        where: { id: orchestra.id }
      })
      console.log('Orchestra deleted successfully')
    } else {
      console.log('No orchestra found with subdomain "brusk"')
    }
  } catch (error) {
    console.error('Error cleaning up orchestra:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOrchestra()