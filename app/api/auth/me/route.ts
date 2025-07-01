import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthCookie()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const payload = await verifyToken(token)
    
    if (!payload || !payload.authenticated) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // If userId exists, fetch user details
    if (payload.userId) {
      const user = await prismaMultitenant.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          }
        }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(user)
    }
    
    // Legacy auth - return basic info
    return NextResponse.json({
      id: 'legacy',
      email: 'admin@orchestra.local',
      name: 'Admin',
      role: 'admin',
      tenantId: 'default-tenant'
    })
    
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}