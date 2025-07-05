import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { neonPrisma } from '@/lib/prisma-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get orchestra details if user has orchestraId
    let orchestra = null
    if (user.orchestraId) {
      try {
        orchestra = await neonPrisma.orchestra.findUnique({
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