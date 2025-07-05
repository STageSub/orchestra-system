import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
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
        const orchestraPrisma = new PrismaClient({
          datasources: {
            db: { url: orchestra.databaseUrl! }
          }
        })
        await orchestraPrisma.$queryRaw`SELECT 1`
        await orchestraPrisma.$disconnect()
        
        health.databases.push({ 
          name: orchestra.name, 
          status: 'healthy' 
        })
      } catch (error) {
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