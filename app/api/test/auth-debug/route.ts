import { NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { authenticateUser } from '@/lib/auth-db'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const debug = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_exists: !!process.env.JWT_SECRET,
        DATABASE_URL_exists: !!process.env.DATABASE_URL,
        DATABASE_URL_is_neon: process.env.DATABASE_URL?.includes('neon') || false
      },
      database: {
        connected: false,
        userTableExists: false,
        userCount: 0,
        users: [] as any[]
      },
      authentication: {
        superadmin: false,
        scoAdmin: false,
        scoscoAdmin: false
      }
    }

    // Test database connection
    try {
      await neonPrisma.$connect()
      debug.database.connected = true
    } catch (error) {
      debug.database.connected = false
      return NextResponse.json({ debug, error: 'Database connection failed' })
    }

    // Check User table
    try {
      const users = await neonPrisma.user.findMany({
        select: {
          username: true,
          email: true,
          role: true,
          active: true,
          createdAt: true
        }
      })
      debug.database.userTableExists = true
      debug.database.userCount = users.length
      debug.database.users = users
    } catch (error) {
      debug.database.userTableExists = false
    }

    // Test authentication
    const testAuth = async (username: string, password: string) => {
      try {
        const result = await authenticateUser(username, password)
        return !!result
      } catch {
        return false
      }
    }

    debug.authentication.superadmin = await testAuth('superadmin', 'superadmin123')
    debug.authentication.scoAdmin = await testAuth('sco-admin', 'sco-admin123')
    debug.authentication.scoscoAdmin = await testAuth('scosco-admin', 'scosco-admin123')

    await neonPrisma.$disconnect()

    return NextResponse.json(debug)
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}