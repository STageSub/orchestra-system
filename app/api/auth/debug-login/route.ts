import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-db'
import { neonPrisma } from '@/lib/prisma-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Basic info without exposing sensitive data
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        hasUsername: !!username,
        usernameLength: username?.length || 0,
        hasPassword: !!password,
        passwordLength: password?.length || 0
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      },
      database: {
        connected: false,
        userFound: false,
        authResult: false
      }
    }
    
    // Try to connect to database
    try {
      await neonPrisma.$connect()
      debugInfo.database.connected = true
      
      // Try to find user (without exposing user data)
      const user = await neonPrisma.user.findUnique({
        where: { username }
      })
      
      debugInfo.database.userFound = !!user
      
      // Try authentication
      if (user) {
        const authResult = await authenticateUser(username, password)
        debugInfo.database.authResult = !!authResult
      }
      
      await neonPrisma.$disconnect()
    } catch (error) {
      console.error('Database error in debug:', error)
    }
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}