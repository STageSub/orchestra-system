import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from '@/lib/database-config'

const prisma = new PrismaClient()

export async function GET() {
  // Check superadmin authentication
  // TODO: Re-enable auth check after testing
  // const authResult = await checkSuperadminAuth()
  // if (!authResult.authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

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
        // Skip if no real database URL
        if (!orchestra.databaseUrl || orchestra.databaseUrl.includes('dummy')) {
          continue
        }

        // Get Prisma client for this orchestra
        const orchestraPrisma = await getPrismaClient(orchestra.subdomain)

        // Fetch metrics from orchestra database
        const musicians = await orchestraPrisma.musician.count()
        const activeMusiciansCount = await orchestraPrisma.musician.count({
          where: { active: true }
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
            plan: 'medium', // Default for now
            status: 'active',
            pricePerMonth: 4990,
            maxMusicians: 200,
            maxProjects: 20
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

    // Calculate total MRR (mock for now)
    const totalMRR = orchestraMetrics.filter(o => o.subscription).length * 4990

    // Create recent events (mock for now)
    const recentEvents = [
      {
        id: '1',
        type: 'orchestra_created',
        severity: 'info',
        title: 'SCO Admin tillagd',
        description: 'Ny orkester registrerad i systemet',
        createdAt: new Date().toISOString(),
        orchestra: { name: 'SCO Admin' }
      },
      {
        id: '2',
        type: 'orchestra_created',
        severity: 'info',
        title: 'SCOSO Admin tillagd',
        description: 'Ny orkester registrerad i systemet',
        createdAt: new Date().toISOString(),
        orchestra: { name: 'SCOSO Admin' }
      }
    ]

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