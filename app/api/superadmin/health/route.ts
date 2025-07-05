import { NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  console.log('Health check endpoint called')
  
  const authResult = await checkSuperadminAuth()
  console.log('Auth result:', authResult)
  
  if (!authResult.authorized) {
    console.log('Health check unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const health = {
      api: 'operational',
      databases: [] as any[],
      email: 'operational',
      timestamp: new Date().toISOString()
    }

    // API is operational if we got this far
    health.api = 'operational'
    console.log('API health check passed')

    // Check main database
    try {
      await neonPrisma.$queryRaw`SELECT 1`
      health.databases.push({ name: 'Main (Neon)', status: 'healthy' })
      console.log('Main database: healthy')
    } catch (error) {
      console.error('Main database check failed:', error)
      health.databases.push({ name: 'Main (Neon)', status: 'unhealthy' })
    }

    // Check orchestra databases
    const orchestras = await neonPrisma.orchestra.findMany({
      orderBy: { id: 'asc' }
    })

    for (const orchestra of orchestras) {
      try {
        // Skip if no valid database URL
        if (!orchestra.databaseUrl || orchestra.databaseUrl.includes('dummy')) {
          health.databases.push({ 
            name: orchestra.name, 
            status: 'no-database' 
          })
          continue
        }

        const orchestraPrisma = new PrismaClient({
          datasources: {
            db: { url: orchestra.databaseUrl }
          }
        })
        
        // Set a timeout for the health check
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
        
        await Promise.race([
          orchestraPrisma.$queryRaw`SELECT 1`,
          timeoutPromise
        ])
        
        await orchestraPrisma.$disconnect()
        
        health.databases.push({ 
          name: orchestra.name, 
          status: 'healthy' 
        })
      } catch (error: any) {
        console.error(`Health check failed for ${orchestra.name}:`, error.message)
        health.databases.push({ 
          name: orchestra.name, 
          status: 'unhealthy' 
        })
      }
    }

    // Check email service
    try {
      // Check if we have Resend API key
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey && resendKey.length > 0 && resendKey !== 'undefined') {
        health.email = 'operational'
        console.log('Email service: operational')
      } else {
        health.email = 'error'
        console.log('Email service: No valid RESEND_API_KEY configured')
      }
    } catch (error) {
      health.email = 'error'
      console.error('Email service check failed:', error)
    }

    return NextResponse.json(health)
  } catch (error: any) {
    console.error('Health check error:', error.message)
    return NextResponse.json(
      { 
        api: 'error',
        databases: [],
        email: 'unknown',
        error: 'Health check failed',
        details: error.message
      },
      { status: 500 }
    )
  } finally {
    // neonPrisma is a singleton, don't disconnect
  }
}