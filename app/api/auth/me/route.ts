import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/auth/me] Starting...')
    
    // Log cookies for debugging
    const cookieHeader = request.headers.get('cookie')
    console.log('[/api/auth/me] Cookie header:', cookieHeader)
    
    const user = await getCurrentUser()
    console.log('[/api/auth/me] getCurrentUser result:', user ? `User ${user.id}` : 'null')
    
    if (!user) {
      console.log('[/api/auth/me] No user found, returning 401')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get orchestra details if user has orchestraId
    let orchestra = null
    if (user.orchestraId) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
            },
          },
        })
        
        orchestra = await prisma.orchestra.findUnique({
          where: { id: user.orchestraId },
          select: {
            id: true,
            name: true,
            orchestraId: true,
            subdomain: true,
            logoUrl: true,
            plan: true,
            status: true
          }
        })
        
        await prisma.$disconnect()
      } catch (error) {
        console.error('Error fetching orchestra:', error)
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        orchestraId: user.orchestraId
      },
      orchestra
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    )
  }
}