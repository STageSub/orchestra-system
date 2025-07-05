import { PrismaClient } from '@prisma/client'

interface SubscriptionLimits {
  maxMusicians: number
  maxProjects: number
}

export async function checkSubscriptionLimit(
  orchestraId: string,
  limitType: 'musicians' | 'projects'
): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
  const prisma = new PrismaClient()
  
  try {
    // Get orchestra with subscription details
    const orchestra = await prisma.orchestra.findUnique({
      where: { id: orchestraId }
    })

    if (!orchestra) {
      return { allowed: false, message: 'Orchestra not found' }
    }

    // Get current counts
    let currentCount = 0
    let limit = 0

    if (limitType === 'musicians') {
      // Count musicians in this orchestra's database
      // For now, we'll use the main database
      // In production, this would query the orchestra's specific database
      currentCount = await prisma.musician.count()
      limit = orchestra.maxMusicians
    } else if (limitType === 'projects') {
      currentCount = await prisma.project.count()
      limit = orchestra.maxProjects
    }

    const allowed = currentCount < limit

    return {
      allowed,
      message: allowed ? undefined : `Limit reached: ${currentCount}/${limit} ${limitType}`,
      current: currentCount,
      limit
    }
  } catch (error) {
    console.error('Error checking subscription limit:', error)
    return { allowed: false, message: 'Error checking limits' }
  } finally {
    await prisma.$disconnect()
  }
}

export async function enforceSubscriptionLimits(
  orchestraId: string,
  operation: 'create_musician' | 'create_project'
): Promise<{ allowed: boolean; message?: string }> {
  const limitType = operation === 'create_musician' ? 'musicians' : 'projects'
  return checkSubscriptionLimit(orchestraId, limitType)
}