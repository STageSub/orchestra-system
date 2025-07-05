import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'

const prisma = new PrismaClient()

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

    // Check API status by verifying we can query the database
    try {
      await prisma.$queryRaw`SELECT 1`
      health.api = 'operational'
      console.log('API health check passed')
    } catch (error: any) {
      console.error('API health check failed:', error.message)
      health.api = 'error'
    }

    // Check main database
    try {
      await prisma.$queryRaw`SELECT 1`
      health.databases.push({ name: 'Main (Neon)', status: 'healthy' })
    } catch (error) {
      console.error('Main database check failed:', error)
      health.databases.push({ name: 'Main (Neon)', status: 'unhealthy' })
      health.api = 'error' // If main DB is down, API is not operational
    }

    // Check orchestra databases
    const orchestras = await prisma.orchestra.findMany({
      where: { status: 'active' }
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
      if (process.env.RESEND_API_KEY) {
        health.email = 'operational'
      } else {
        health.email = 'error'
        console.error('Email service error: No RESEND_API_KEY configured')
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
    await prisma.$disconnect()
  }
}