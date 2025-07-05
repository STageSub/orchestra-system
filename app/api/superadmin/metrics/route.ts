import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from '@/lib/database-config'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { neonPrisma } from '@/lib/prisma-dynamic'

export async function GET(request: Request) {
  console.log('Metrics endpoint called')
  
  // Check superadmin authentication
  const authResult = await checkSuperadminAuth()
  console.log('Auth result:', authResult)
  
  if (!authResult.authorized) {
    console.log('Metrics endpoint unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Fetching metrics...')
    // Get all orchestras from main database
    const orchestras = await neonPrisma.orchestra.findMany({
      orderBy: { orchestraId: 'asc' }
    })

    // Fetch metrics from each orchestra's database
    const orchestraMetrics = []
    let totalMusicians = 0
    let activeMusicians = 0
    let totalProjects = 0
    let activeProjects = 0
    let totalRequests = 0
    let acceptedRequests = 0

    for (const orchestra of orchestras) {
      try {
        console.log(`Processing orchestra: ${orchestra.orchestraId} - ${orchestra.name}`)
        
        // Skip if no real database URL
        if (!orchestra.databaseUrl || orchestra.databaseUrl.includes('dummy')) {
          console.log(`  Skipping - no valid database URL`)
          // Add orchestra with placeholder metrics
          orchestraMetrics.push({
            id: orchestra.id,
            orchestraId: orchestra.orchestraId,
            name: orchestra.name,
            subdomain: orchestra.subdomain,
            status: 'pending', // Show as pending if no database
            logoUrl: orchestra.logoUrl,
            subscription: {
              plan: orchestra.plan || 'medium',
              status: 'pending',
              pricePerMonth: orchestra.pricePerMonth || 4990,
              maxMusicians: orchestra.maxMusicians || 200,
              maxProjects: orchestra.maxProjects || 20
            },
            metrics: [{
              totalMusicians: 0,
              activeMusicians: 0,
              totalProjects: 0,
              activeProjects: 0,
              totalRequests: 0,
              acceptedRequests: 0,
              createdAt: new Date().toISOString()
            }]
          })
          continue
        }

        // Create Prisma client directly with database URL
        const orchestraPrisma = new PrismaClient({
          datasources: {
            db: {
              url: orchestra.databaseUrl,
            },
          },
        })

        // Test connection first
        await orchestraPrisma.$queryRaw`SELECT 1`

        // Fetch metrics from orchestra database
        const musicians = await orchestraPrisma.musician.count()
        const activeMusiciansCount = await orchestraPrisma.musician.count({
          where: { isActive: true }
        })
        const projects = await orchestraPrisma.project.count()
        const activeProjectsCount = await orchestraPrisma.project.count({
          where: { 
            startDate: { gte: new Date() }
          }
        })
        const requests = await orchestraPrisma.request.count()
        const acceptedRequestsCount = await orchestraPrisma.request.count({
          where: { status: 'accepted' }
        })
        
        console.log(`  Musicians: ${musicians} (${activeMusiciansCount} active)`)
        console.log(`  Projects: ${projects} (${activeProjectsCount} active)`)

        // Add to totals
        totalMusicians += musicians
        activeMusicians += activeMusiciansCount
        totalProjects += projects
        activeProjects += activeProjectsCount
        totalRequests += requests
        acceptedRequests += acceptedRequestsCount

        // Create orchestra data with metrics
        orchestraMetrics.push({
          id: orchestra.id,
          orchestraId: orchestra.orchestraId,
          name: orchestra.name,
          subdomain: orchestra.subdomain,
          status: orchestra.status,
          logoUrl: orchestra.logoUrl,
          subscription: {
            plan: orchestra.plan || 'medium',
            status: 'active',
            pricePerMonth: orchestra.pricePerMonth || 4990,
            maxMusicians: orchestra.maxMusicians || 200,
            maxProjects: orchestra.maxProjects || 20
          },
          metrics: [{
            totalMusicians: musicians,
            activeMusicians: activeMusiciansCount,
            totalProjects: projects,
            activeProjects: activeProjectsCount,
            totalRequests: requests,
            acceptedRequests: acceptedRequestsCount,
            createdAt: new Date().toISOString()
          }]
        })
        
        // Disconnect the orchestra prisma client
        await orchestraPrisma.$disconnect()
      } catch (error: any) {
        console.error(`Error fetching metrics for ${orchestra.subdomain}:`, error.message)
        // Add orchestra with error status
        orchestraMetrics.push({
          id: orchestra.id,
          orchestraId: orchestra.orchestraId,
          name: orchestra.name,
          subdomain: orchestra.subdomain,
          status: 'error',
          logoUrl: orchestra.logoUrl,
          subscription: {
            plan: orchestra.plan || 'medium',
            status: 'error',
            pricePerMonth: orchestra.pricePerMonth || 4990,
            maxMusicians: orchestra.maxMusicians || 200,
            maxProjects: orchestra.maxProjects || 20
          },
          metrics: [{
            totalMusicians: 0,
            activeMusicians: 0,
            totalProjects: 0,
            activeProjects: 0,
            totalRequests: 0,
            acceptedRequests: 0,
            createdAt: new Date().toISOString(),
            error: error.message
          }]
        })
      }
    }

    // Calculate total MRR from actual subscription data
    const totalMRR = orchestraMetrics
      .filter(o => o.subscription && o.status === 'active')
      .reduce((sum, o) => sum + (o.subscription?.pricePerMonth || 0), 0)

    // Fetch recent events directly instead of HTTP call
    let recentEvents = []
    try {
      // Collect logs from each orchestra's database
      for (const orchestra of orchestras) {
        try {
          // Skip if no valid database URL
          if (!orchestra.databaseUrl || orchestra.databaseUrl.includes('dummy')) {
            continue
          }

          const orchestraPrisma = new PrismaClient({
            datasources: {
              db: { url: orchestra.databaseUrl }
            }
          })

          // Check if SystemLog table exists
          try {
            await orchestraPrisma.$queryRaw`SELECT 1 FROM "SystemLog" LIMIT 1`
          } catch (tableError: any) {
            if (tableError.message?.includes('does not exist')) {
              await orchestraPrisma.$disconnect()
              continue
            }
            throw tableError
          }

          const logs = await orchestraPrisma.systemLog.findMany({
            where: {
              category: { in: ['auth', 'system', 'request', 'email', 'user'] }
            },
            orderBy: { timestamp: 'desc' },
            take: 5 // Get 5 from each orchestra
          })

          // Add orchestra info to each log
          logs.forEach(log => {
            const severity = log.level === 'error' ? 'error' : 
                            log.level === 'warn' ? 'warning' : 'info'
            
            recentEvents.push({
              id: log.id,
              type: log.category,
              severity,
              title: log.message,
              description: log.metadata ? JSON.stringify(log.metadata) : log.message,
              createdAt: log.timestamp.toISOString(),
              orchestra: { 
                id: orchestra.id,
                name: orchestra.name 
              }
            })
          })

          await orchestraPrisma.$disconnect()
        } catch (error: any) {
          console.error(`Failed to fetch logs from ${orchestra.name}:`, error.message)
        }
      }

      // Sort by timestamp and take latest 10
      recentEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      recentEvents = recentEvents.slice(0, 10)

      // If no events found, add a default event
      if (recentEvents.length === 0) {
        recentEvents.push({
          id: '1',
          type: 'system',
          severity: 'info',
          title: 'System startat',
          description: 'Superadmin dashboard aktiverat',
          createdAt: new Date().toISOString(),
          orchestra: null
        })
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      recentEvents = [{
        id: '1',
        type: 'system',
        severity: 'info',
        title: 'Kunde inte hämta händelser',
        description: 'Kontrollera databasanslutningarna',
        createdAt: new Date().toISOString(),
        orchestra: null
      }]
    }

    return NextResponse.json({
      orchestras: orchestraMetrics,
      metrics: {
        totalMusicians,
        activeMusicians,
        totalProjects,
        activeProjects,
        totalRequests,
        acceptedRequests
      },
      revenue: {
        mrr: totalMRR,
        currency: 'SEK'
      },
      recentEvents
    })
  } catch (error) {
    console.error('Error fetching superadmin metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  } finally {
    await neonPrisma.$disconnect()
  }
}