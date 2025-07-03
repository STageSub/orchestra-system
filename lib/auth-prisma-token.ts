import { getPrismaClient } from './database-config'
import { prisma } from './prisma'

/**
 * Get Prisma client based on a request token
 * This is used for public endpoints where users respond via token
 */
export async function getPrismaForToken(token: string): Promise<any> {
  try {
    // First, use the main database to look up the token and find which orchestra it belongs to
    const requestToken = await prisma.requestToken.findUnique({
      where: { token },
      include: {
        request: {
          include: {
            projectNeed: {
              include: {
                project: {
                  select: {
                    orchestraId: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!requestToken) {
      console.log('Token not found, using default database')
      return prisma
    }
    
    const orchestraId = requestToken.request.projectNeed.project.orchestraId
    
    if (orchestraId) {
      // Get the orchestra details
      const orchestra = await prisma.orchestra.findUnique({
        where: { id: orchestraId },
        select: { subdomain: true, databaseUrl: true }
      })
      
      if (orchestra?.subdomain) {
        console.log(`Using database for orchestra: ${orchestra.subdomain} (via token)`)
        return await getPrismaClient(orchestra.subdomain)
      }
    }
    
    // Fallback to default database
    console.log('Using default database (no orchestra found for token)')
    return prisma
  } catch (error) {
    console.error('Error in getPrismaForToken:', error)
    return prisma
  }
}