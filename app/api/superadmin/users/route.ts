import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET all users
export async function GET() {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        orchestra: {
          select: {
            id: true,
            name: true,
            orchestraId: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // superadmin first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.username || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: body.username },
          { email: body.email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        passwordHash,
        role: body.role,
        orchestraId: body.orchestraId || null,
        active: true
      },
      include: {
        orchestra: true
      }
    })

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}