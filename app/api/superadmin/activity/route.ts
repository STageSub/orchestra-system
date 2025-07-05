import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get recent system logs from all orchestra databases
    const events: any[] = []
    
    // Get orchestras
    const orchestras = await prisma.orchestra.findMany({
      where: { status: 'active' }
    })

    // Collect logs from each orchestra's database
    for (const orchestra of orchestras) {
      try {
        const orchestraPrisma = new PrismaClient({
          datasources: {
            db: { url: orchestra.databaseUrl! }
          }
        })

        const logs = await orchestraPrisma.systemLog.findMany({
          where: {
            category: { in: ['auth', 'system', 'request'] }
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        })

        // Add orchestra info to each log
        logs.forEach(log => {
          events.push({
            id: log.id,
            type: log.category,
            severity: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info',
            title: log.message,
            description: `${orchestra.name} - ${log.message}`,
            createdAt: log.timestamp.toISOString(),
            orchestra: { 
              id: orchestra.id,
              name: orchestra.name 
            },
            metadata: log.metadata
          })
        })

        await orchestraPrisma.$disconnect()
      } catch (error) {
        console.error(`Failed to fetch logs from ${orchestra.name}:`, error)
      }
    }

    // Sort by timestamp and apply pagination
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const paginatedEvents = events.slice(offset, offset + limit)

    return NextResponse.json({
      events: paginatedEvents,
      total: events.length,
      hasMore: offset + limit < events.length
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}