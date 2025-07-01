import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
import { hashPassword } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

async function verifySuperadmin(request: NextRequest) {
  const token = await getAuthCookie()
  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }
  
  const payload = await verifyToken(token)
  if (!payload?.userId) {
    return { error: 'Unauthorized', status: 401 }
  }
  
  const user = await prismaMultitenant.user.findUnique({
    where: { id: payload.userId },
    select: { role: true }
  })
  
  if (user?.role !== 'superadmin') {
    return { error: 'Forbidden', status: 403 }
  }
  
  return { success: true, userId: payload.userId }
}

// GET /api/superadmin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify superadmin
    const auth = await verifySuperadmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    // Get user details
    const user = await prismaMultitenant.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
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
    
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify superadmin
    const auth = await verifySuperadmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const body = await request.json()
    const {
      email,
      name,
      role,
      tenantId,
      password
    } = body
    
    // Check if user exists
    const existingUser = await prismaMultitenant.user.findUnique({
      where: { id },
      select: { role: true }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent demoting the last superadmin
    if (existingUser.role === 'superadmin' && role !== 'superadmin') {
      const superadminCount = await prismaMultitenant.user.count({
        where: { role: 'superadmin' }
      })
      
      if (superadminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last superadmin' },
          { status: 400 }
        )
      }
    }
    
    // Prevent self-demotion
    if (id === auth.userId && role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot demote yourself' },
        { status: 400 }
      )
    }
    
    // Check if email is taken by another user
    if (email) {
      const emailTaken = await prismaMultitenant.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      })
      
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }
    
    // Build update data
    const updateData: any = {}
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (tenantId !== undefined) updateData.tenantId = role === 'superadmin' ? null : tenantId
    
    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }
    
    // Update user
    const updatedUser = await prismaMultitenant.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    })
    
    return NextResponse.json(updatedUser)
    
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify superadmin
    const auth = await verifySuperadmin(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      )
    }
    
    // Check if user exists and get role
    const user = await prismaMultitenant.user.findUnique({
      where: { id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent deleting the last superadmin
    if (user.role === 'superadmin') {
      const superadminCount = await prismaMultitenant.user.count({
        where: { role: 'superadmin' }
      })
      
      if (superadminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last superadmin' },
          { status: 400 }
        )
      }
    }
    
    // Delete user
    await prismaMultitenant.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}