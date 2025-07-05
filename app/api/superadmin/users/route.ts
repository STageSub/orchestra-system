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
    // First check if User table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
    } catch (tableError: any) {
      console.error('User table check failed:', tableError)
      if (tableError.message?.includes('does not exist')) {
        console.error('User table does not exist in database')
        return NextResponse.json({ 
          users: [],
          error: 'User table not found' 
        })
      }
    }

    // Now that schema is fixed, use normal Prisma query
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

    console.log(`Found ${users.length} users`)
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    console.error('Error details:', error.message)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error.message,
        users: []
      },
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
          { email: body.email },
          { username: body.username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(body.password, 10)

    // Create user using Prisma
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        passwordHash: passwordHash,
        role: body.role,
        orchestraId: body.orchestraId || null,
        active: true
      },
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