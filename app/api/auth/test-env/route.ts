import { NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'

export async function GET() {
  // Basic environment check that doesn't expose sensitive data
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      hasSuperadminPassword: !!process.env.SUPERADMIN_PASSWORD,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isProduction: process.env.NODE_ENV === 'production'
    },
    database: {
      canConnect: false,
      hasUserTable: false,
      userCount: 0
    },
    auth: {
      oldSystemAvailable: false,
      newSystemAvailable: false
    }
  }
  
  // Check if old auth system is available
  envCheck.auth.oldSystemAvailable = !!(process.env.ADMIN_PASSWORD && process.env.SUPERADMIN_PASSWORD)
  
  // Try database connection
  try {
    await neonPrisma.$connect()
    envCheck.database.canConnect = true
    
    // Check User table
    try {
      const count = await neonPrisma.user.count()
      envCheck.database.hasUserTable = true
      envCheck.database.userCount = count
      envCheck.auth.newSystemAvailable = count > 0
    } catch (error) {
      envCheck.database.hasUserTable = false
    }
    
    await neonPrisma.$disconnect()
  } catch (error) {
    envCheck.database.canConnect = false
  }
  
  return NextResponse.json(envCheck)
}