import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
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
  
  return { success: true }
}

// GET /api/superadmin/tenants/[id] - Get tenant details
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
    
    // Get tenant with all related counts
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastLoginAt: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            musicians: true,
            instruments: true,
            projects: true,
            users: true
          }
        }
      }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Get usage stats
    const [activeProjects, totalRequests] = await Promise.all([
      prismaMultitenant.project.count({
        where: {
          tenantId: id,
          startDate: { gte: new Date() }
        }
      }),
      prismaMultitenant.request.count({
        where: {
          musician: { tenantId: id }
        }
      })
    ])
    
    return NextResponse.json({
      ...tenant,
      usage: {
        activeProjects,
        totalRequests
      }
    })
    
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/tenants/[id] - Update tenant
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
      name,
      subscription,
      subscriptionStatus,
      maxMusicians,
      maxActiveProjects,
      maxInstruments,
      logoUrl,
      primaryColor
    } = body
    
    // Update tenant
    const updatedTenant = await prismaMultitenant.tenant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subscription !== undefined && { subscription }),
        ...(subscriptionStatus !== undefined && { subscriptionStatus }),
        ...(maxMusicians !== undefined && { maxMusicians }),
        ...(maxActiveProjects !== undefined && { maxActiveProjects }),
        ...(maxInstruments !== undefined && { maxInstruments }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(primaryColor !== undefined && { primaryColor })
      }
    })
    
    return NextResponse.json(updatedTenant)
    
  } catch (error) {
    console.error('Update tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/tenants/[id] - Delete tenant
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
    
    // Check if tenant has data
    const [hasUsers, hasMusicians, hasProjects] = await Promise.all([
      prismaMultitenant.user.count({ where: { tenantId: id } }),
      prismaMultitenant.musician.count({ where: { tenantId: id } }),
      prismaMultitenant.project.count({ where: { tenantId: id } })
    ])
    
    if (hasUsers > 0 || hasMusicians > 0 || hasProjects > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete tenant with data. Archive instead or delete all data first.',
          details: {
            users: hasUsers,
            musicians: hasMusicians,
            projects: hasProjects
          }
        },
        { status: 400 }
      )
    }
    
    // Delete tenant (cascade will handle related empty tables)
    await prismaMultitenant.tenant.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}