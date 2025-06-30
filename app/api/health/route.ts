import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkDatabaseHealth, getConnectionStats } from '@/lib/db-health'

export async function GET() {
  try {
    // Basic health check
    const healthResult = await checkDatabaseHealth()
    
    // Get connection pool stats
    const connectionStats = await getConnectionStats()
    
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
    
    // Get basic stats
    const stats = await Promise.allSettled([
      prisma.musician.count(),
      prisma.project.count(),
      prisma.request.count({ where: { status: 'pending' } })
    ])
    
    const [musicianCount, projectCount, pendingRequests] = stats.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      console.error(`Failed to get stat ${index}:`, result.reason)
      return -1
    })
    
    return NextResponse.json({
      status: healthResult.status === 'healthy' ? 'ok' : 'degraded',
      database: {
        status: healthResult.status,
        latency: `${healthResult.latency}ms`,
        connectionPool: connectionStats,
        error: healthResult.error
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasAllEnvVars: missingEnvVars.length === 0,
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
        provider: 'supabase'
      },
      stats: {
        musicians: musicianCount,
        projects: projectCount,
        pendingRequests: pendingRequests
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        provider: 'supabase'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}