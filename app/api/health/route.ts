import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    }
    
    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, value]) => !value)
      .map(([key]) => key)
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasAllEnvVars: missingEnvVars.length === 0,
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}