import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET single user
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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orchestra: {
          select: {
            id: true,
            name: true,
            orchestraId: true
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

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT update user
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
    
    // Check if username or email already exists (excluding current user)
    if (body.username || body.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                body.username ? { username: body.username } : {},
                body.email ? { email: body.email } : {}
              ]
            }
          ]
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already in use' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(body.username && { username: body.username }),
      ...(body.email && { email: body.email }),
      ...(body.role && { role: body.role }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.orchestraId !== undefined && { orchestraId: body.orchestraId || null })
    }

    // Handle password update
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        orchestra: true
      }
    })

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Don't allow deleting yourself
    if (authResult.user?.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}