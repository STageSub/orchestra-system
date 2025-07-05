import { NextRequest, NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  // Simple security check - only allow in development or with secret
  const debugSecret = request.headers.get('x-debug-secret')
  if (process.env.NODE_ENV === 'production' && debugSecret !== 'debug-auth-2025') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      bcryptVersion: bcrypt.version || 'unknown',
      database: 'checking...',
      users: [] as any[],
      testPasswords: {} as any
    }

    // Test database connection
    try {
      await neonPrisma.$queryRaw`SELECT 1`
      debug.database = 'connected'
    } catch (error) {
      debug.database = `error: ${error}`
    }

    // Get all users
    const users = await neonPrisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        passwordHash: true,
        lastLogin: true
      }
    })

    // Test password verification for each user
    for (const user of users) {
      const userDebug = {
        username: user.username,
        role: user.role,
        active: user.active,
        hashLength: user.passwordHash?.length || 0,
        hashPrefix: user.passwordHash?.substring(0, 7) || 'none',
        hashSuffix: user.passwordHash?.slice(-4) || 'none',
        passwordTests: {} as any
      }

      // Test common passwords
      const testPasswords = ['orchestra123', 'admin123', 'Orchestra123!']
      for (const testPass of testPasswords) {
        try {
          const result = await bcrypt.compare(testPass, user.passwordHash)
          userDebug.passwordTests[testPass] = result
        } catch (error) {
          userDebug.passwordTests[testPass] = `error: ${error}`
        }
      }

      debug.users.push(userDebug)
    }

    // Test creating new hashes
    debug.testPasswords = {
      orchestra123: {
        hash: await bcrypt.hash('orchestra123', 10),
        verify: false
      },
      admin123: {
        hash: await bcrypt.hash('admin123', 10),
        verify: false
      }
    }

    // Verify the test hashes
    debug.testPasswords.orchestra123.verify = await bcrypt.compare(
      'orchestra123', 
      debug.testPasswords.orchestra123.hash
    )
    debug.testPasswords.admin123.verify = await bcrypt.compare(
      'admin123', 
      debug.testPasswords.admin123.hash
    )

    return NextResponse.json(debug, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}