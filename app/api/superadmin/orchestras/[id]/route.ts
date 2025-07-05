import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { neonPrisma } from '@/lib/prisma-dynamic'

// GET orchestra by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const orchestra = await neonPrisma.orchestra.findUnique({
      where: { id }
    })

    if (!orchestra) {
      return NextResponse.json(
        { error: 'Orchestra not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(orchestra)
  } catch (error) {
    console.error('Error fetching orchestra:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orchestra' },
      { status: 500 }
    )
  }
}

// PUT update orchestra
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    
    // Update orchestra details including subscription
    const updatedOrchestra = await neonPrisma.orchestra.update({
      where: { id },
      data: {
        name: body.name,
        contactName: body.contactName || undefined,
        contactEmail: body.contactEmail || undefined,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
        plan: body.plan || undefined,
        maxMusicians: body.maxMusicians !== undefined ? parseInt(body.maxMusicians) : undefined,
        maxProjects: body.maxProjects !== undefined ? parseInt(body.maxProjects) : undefined,
        pricePerMonth: body.pricePerMonth !== undefined ? parseInt(body.pricePerMonth) : undefined,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      orchestra: updatedOrchestra
    })
  } catch (error) {
    console.error('Error updating orchestra:', error)
    return NextResponse.json(
      { error: 'Failed to update orchestra' },
      { status: 500 }
    )
  }
}

// PATCH update orchestra status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    
    if (!body.status || !['active', 'inactive', 'suspended'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedOrchestra = await neonPrisma.orchestra.update({
      where: { id },
      data: {
        status: body.status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      orchestra: updatedOrchestra
    })
  } catch (error) {
    console.error('Error updating orchestra status:', error)
    return NextResponse.json(
      { error: 'Failed to update orchestra status' },
      { status: 500 }
    )
  } finally {
    await neonPrisma.$disconnect()
  }
}