import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from '@/lib/database-config'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  // Check superadmin authentication
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all orchestras from main database
    const orchestras = await prisma.$queryRaw`
      SELECT * FROM "Orchestra" 
      WHERE status = 'active' 
      ORDER BY subdomain
    ` as any[]

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
      } catch (error) {
        console.error(`Error fetching metrics for ${orchestra.subdomain}:`, error)
        // Add orchestra without metrics
        orchestraMetrics.push({
          id: orchestra.id,
          orchestraId: orchestra.orchestraId,
          name: orchestra.name,
          subdomain: orchestra.subdomain,
          status: orchestra.status,
          subscription: null,
          metrics: []
        })
      }
    }

    // Calculate total MRR from actual subscription data
    const totalMRR = orchestraMetrics
      .filter(o => o.subscription && o.status === 'active')
      .reduce((sum, o) => sum + (o.subscription?.pricePerMonth || 0), 0)

    // Fetch recent events from activity API
    let recentEvents = []
    try {
      // Make internal API call to activity endpoint
      const activityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/superadmin/activity?limit=10`, {
        headers: {
          cookie: request.headers.get('cookie') || '' // Pass through auth cookies
        }
      })
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        recentEvents = activityData.events
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      // Fall back to empty events rather than fail the whole request
      recentEvents = []
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
    await prisma.$disconnect()
  }
}