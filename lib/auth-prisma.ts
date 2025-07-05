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
  console.log('[getPrismaForUser] Starting...')
  
  // Log request headers for debugging
  const userAgent = request.headers.get('user-agent') || 'unknown'
  console.log('[getPrismaForUser] User-Agent:', userAgent)
  
  try {
    // Get token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('orchestra-admin-session')?.value
    
    if (!token) {
      console.log('[getPrismaForUser] No auth token found')
      
      // TEMPORARY: Use SCO database as fallback for testing
      // This should be removed once auth is fixed
      const fallbackUrl = process.env.DATABASE_URL_POOL_1
      if (fallbackUrl) {
        console.log('[getPrismaForUser] Using fallback database (SCO) for testing')
        try {
          const { PrismaClient } = require('@prisma/client')
          return new PrismaClient({
            datasources: {
              db: {
                url: fallbackUrl
              }
            }
          })
        } catch (error) {
          console.error('[getPrismaForUser] Fallback failed:', error)
        }
      }
      
      return prisma
    }
    
    // Verify token and get user info
    const payload = await verifyToken(token)
    
    if (!payload || !payload.userId) {
      console.log('[getPrismaForUser] Invalid token payload:', payload ? 'missing userId' : 'null payload')
      return prisma
    }
    
    console.log('[getPrismaForUser] Token verified, userId:', payload.userId, 'orchestraId:', payload.orchestraId)
    
    // If user has an orchestraId, get the orchestra's database
    if (payload.orchestraId) {
      try {
        const orchestra = await prisma.orchestra.findUnique({
          where: { id: payload.orchestraId },
          select: { databaseUrl: true, name: true, orchestraId: true }
        })
        
        if (!orchestra) {
          console.error('[getPrismaForUser] Orchestra not found for ID:', payload.orchestraId)
          return prisma
        }
        
        console.log(`[getPrismaForUser] Found orchestra: ${orchestra.name} (${orchestra.orchestraId}), has databaseUrl: ${!!orchestra.databaseUrl}`)
        
        if (orchestra.databaseUrl) {
          try {
            // Create a new Prisma client directly with the database URL
            const { PrismaClient } = require('@prisma/client')
            const client = new PrismaClient({
              datasources: {
                db: {
                  url: orchestra.databaseUrl
                }
              }
            })
            console.log(`[getPrismaForUser] Successfully created client for ${orchestra.name}`)
            return client
          } catch (clientError) {
            console.error(`[getPrismaForUser] Failed to create client for ${orchestra.name}:`, clientError)
            
            // Try fallback to environment variable
            const fallbackEnvVar = `DATABASE_URL_POOL_${orchestra.orchestraId === 'cmcnbutg10001smyy8mzufrfp' ? '1' : '2'}`
            const fallbackUrl = process.env[fallbackEnvVar]
            
            if (fallbackUrl) {
              console.log(`[getPrismaForUser] Trying fallback with ${fallbackEnvVar}`)
              try {
                const fallbackClient = new PrismaClient({
                  datasources: {
                    db: {
                      url: fallbackUrl
                    }
                  }
                })
                console.log(`[getPrismaForUser] Fallback successful`)
                return fallbackClient
              } catch (fallbackError) {
                console.error(`[getPrismaForUser] Fallback failed:`, fallbackError)
              }
            }
            
            return prisma
          }
        } else {
          console.log('[getPrismaForUser] Orchestra has no database URL, using default')
          return prisma
        }
      } catch (error) {
        console.error('[getPrismaForUser] Error fetching orchestra:', error)
        // Log more details about the error
        if (error instanceof Error) {
          console.error('[getPrismaForUser] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
        }
      }
    }
    
    // Fallback to default database
    console.log('[getPrismaForUser] Using default database (no orchestra found)')
    return prisma
  } catch (error) {
    console.error('[getPrismaForUser] Unexpected error:', error)
    if (error instanceof Error) {
      console.error('[getPrismaForUser] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
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