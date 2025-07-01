import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createToken } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params
    
    // Verify superadmin access
    const token = request.cookies.get('orchestra-admin-session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the tenant and its admin user
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: {
            role: 'admin'
          },
          take: 1
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.users.length === 0) {
      return NextResponse.json({ error: 'No admin user found for this tenant' }, { status: 404 })
    }

    const adminUser = tenant.users[0]

    // Create a temporary session token for the tenant admin
    const tempToken = await createToken(
      adminUser.id,
      tenantId,
      adminUser.role,
      true // Mark as superadmin switch
    )

    // Create response with temporary session
    const response = NextResponse.json({ 
      success: true,
      redirectUrl: '/admin'
    })

    // Set a temporary cookie that will be used by the admin app
    response.cookies.set('orchestra-admin-switch', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour temporary session
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Tenant switch error:', error)
    return NextResponse.json(
      { error: 'Failed to switch tenant' },
      { status: 500 }
    )
  }
}