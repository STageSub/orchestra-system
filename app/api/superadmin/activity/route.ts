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
        // Skip if no valid database URL
        if (!orchestra.databaseUrl || orchestra.databaseUrl.includes('dummy')) {
          console.log(`Skipping ${orchestra.name} - no valid database URL`)
          continue
        }

        const orchestraPrisma = new PrismaClient({
          datasources: {
            db: { url: orchestra.databaseUrl }
          }
        })

        // First check if SystemLog table exists
        try {
          await orchestraPrisma.$queryRaw`SELECT 1 FROM "SystemLog" LIMIT 1`
        } catch (tableError: any) {
          if (tableError.message?.includes('does not exist')) {
            console.log(`SystemLog table not found in ${orchestra.name}`)
            await orchestraPrisma.$disconnect()
            continue
          }
          // Re-throw other errors
          throw tableError
        }

        const logs = await orchestraPrisma.systemLog.findMany({
          where: {
            category: { in: ['auth', 'system', 'request', 'email', 'user'] }
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        })

        // Add orchestra info to each log
        logs.forEach(log => {
          const severity = log.level === 'error' ? 'error' : 
                          log.level === 'warn' ? 'warning' : 'info'
          
          events.push({
            id: log.id,
            type: log.category,
            severity,
            title: log.message,
            description: log.metadata ? JSON.stringify(log.metadata) : log.message,
            createdAt: log.timestamp.toISOString(),
            orchestra: { 
              id: orchestra.id,
              name: orchestra.name 
            },
            metadata: log.metadata
          })
        })

        await orchestraPrisma.$disconnect()
      } catch (error: any) {
        console.error(`Failed to fetch logs from ${orchestra.name}:`, error.message)
      }
    }

    // If no events found, add some default events
    if (events.length === 0) {
      events.push({
        id: '1',
        type: 'system',
        severity: 'info',
        title: 'System startat',
        description: 'Superadmin dashboard aktiverat',
        createdAt: new Date().toISOString(),
        orchestra: null
      })
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