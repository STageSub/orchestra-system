import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from './auth-db'
import { getPrismaClient } from './database-config'
import { prisma } from './prisma'

/**
 * Get Prisma client based on the authenticated user's orchestra
 * This ensures complete data isolation between orchestras
 */
export async function getPrismaForUser(request: NextRequest | Request): Promise<any> {
  try {
    // Get token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('orchestra-admin-session')?.value
    
    if (!token) {
      console.log('No auth token found, using default database')
      return prisma
    }
    
    // Verify token and get user info
    const payload = await verifyToken(token)
    
    if (!payload || !payload.userId) {
      console.log('Invalid token, using default database')
      return prisma
    }
    
    // If user has an orchestraId, get the orchestra's database
    if (payload.orchestraId) {
      try {
        const orchestra = await prisma.orchestra.findUnique({
          where: { id: payload.orchestraId },
          select: { subdomain: true, databaseUrl: true }
        })
        
        if (orchestra?.subdomain) {
          console.log(`Using database for orchestra: ${orchestra.subdomain}`)
          return await getPrismaClient(orchestra.subdomain)
        }
      } catch (error) {
        console.error('Error fetching orchestra:', error)
      }
    }
    
    // Fallback to default database
    console.log('Using default database (no orchestra found)')
    return prisma
  } catch (error) {
    console.error('Error in getPrismaForUser:', error)
    return prisma
  }
}

/**
 * Helper to check if user belongs to a specific orchestra
 */
export async function userBelongsToOrchestra(userId: string, orchestraId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { orchestraId: true }
    })
    
    return user?.orchestraId === orchestraId
  } catch (error) {
    console.error('Error checking user orchestra:', error)
    return false
  }
}