import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { PrismaClient } from '@prisma/client'
import { isSafari } from '@/lib/safari-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/auth/me] Starting...')
    
    // Check if this is Safari
    const userAgent = request.headers.get('user-agent') || ''
    const isSafariBrowser = isSafari(userAgent)
    console.log('[/api/auth/me] User agent:', userAgent.substring(0, 50), 'Safari:', isSafariBrowser)
    
    // Log cookies for debugging
    const cookieHeader = request.headers.get('cookie')
    console.log('[/api/auth/me] Cookie header:', cookieHeader)
    
    // Try to parse cookie manually
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const sessionCookie = cookies.find(c => c.startsWith('orchestra-admin-session='))
      console.log('[/api/auth/me] Session cookie found:', sessionCookie ? 'yes' : 'no')
      if (sessionCookie) {
        console.log('[/api/auth/me] Session cookie value:', sessionCookie.substring(0, 50) + '...')
      }
    }
    
    let user = null
    try {
      // Pass the request to getCurrentUser for Safari detection
      user = await getCurrentUser(request as unknown as Request)
    } catch (error) {
      console.error('[/api/auth/me] Error in getCurrentUser:', error)
    }
    
    console.log('[/api/auth/me] getCurrentUser result:', user ? `User ${user.id}` : 'null')
    
    if (!user) {
      console.log('[/api/auth/me] No user found, returning 401')
      console.log('[/api/auth/me] Debug info:', {
        userAgent: userAgent.substring(0, 100),
        isSafari: isSafariBrowser,
        cookieHeader: cookieHeader ? 'present' : 'missing',
        timestamp: new Date().toISOString()
      })
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