import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'

const prisma = new PrismaClient()

export async function GET() {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const health = {
      api: 'operational',
      databases: [] as any[],
      email: 'operational',
      timestamp: new Date().toISOString()
    }

    // Check main database
    try {
      await prisma.$queryRaw`SELECT 1`
      health.databases.push({ name: 'Main (Neon)', status: 'healthy' })
    } catch (error) {
      health.databases.push({ name: 'Main (Neon)', status: 'unhealthy' })
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

    // Check email service (mock for now)
    // In production, this would check Resend API status
    health.email = 'operational'

    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        api: 'error',
        databases: [],
        email: 'unknown',
        error: 'Health check failed' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}