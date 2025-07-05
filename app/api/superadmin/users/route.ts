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

    // Use raw query due to schema mismatch
    const users = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name as username,
        u.email,
        u.role,
        u."createdAt",
        u."updatedAt",
        u."lastLoginAt" as "lastLogin",
        u."orchestraId",
        COALESCE(u.active, true) as active,
        o.id as "orchestra_id",
        o.name as "orchestra_name",
        o."orchestraId" as "orchestra_orchestraId"
      FROM "User" u
      LEFT JOIN "Orchestra" o ON u."orchestraId" = o.id
      ORDER BY 
        CASE u.role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        u."createdAt" DESC
    `
    
    // Transform the raw results to match expected format
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      orchestra: user.orchestra_id ? {
        id: user.orchestra_id,
        name: user.orchestra_name,
        orchestraId: user.orchestra_orchestraId
      } : null
    }))

    console.log(`Found ${formattedUsers.length} users`)
    return NextResponse.json({ users: formattedUsers })
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