import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
import { hashPassword } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

// GET /api/superadmin/users - List all users across tenants
export async function GET(request: NextRequest) {
  try {
    // Verify superadmin
    const token = await getAuthCookie()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prismaMultitenant.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get all users with tenant info
    const users = await prismaMultitenant.user.findMany({
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
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json({ users })
    
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Verify superadmin
    const token = await getAuthCookie()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const currentUser = await prismaMultitenant.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (currentUser?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Parse request body
    const {
      email,
      password,
      name,
      role,
      tenantId
    } = await request.json()
    
    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }
    
    // Only superadmins can create other superadmins
    if (role === 'superadmin' && currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmins can create other superadmins' },
        { status: 403 }
      )
    }
    
    // Non-superadmin users must have a tenant
    if (role !== 'superadmin' && !tenantId) {
      return NextResponse.json(
        { error: 'Tenant is required for non-superadmin users' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existingUser = await prismaMultitenant.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password)
    
    // Create user
    const newUser = await prismaMultitenant.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        tenantId: role === 'superadmin' ? null : tenantId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
    
    return NextResponse.json(newUser)
    
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}