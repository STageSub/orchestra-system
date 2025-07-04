import { NextResponse } from 'next/server'
import { prismaCentral } from '@/lib/prisma-central'

export async function GET() {
  // Check superadmin authentication
  // TODO: Re-enable auth check after testing
  // const authResult = await checkSuperadminAuth()
  // if (!authResult.authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    // Get overall metrics
    const orchestras = await prismaCentral.orchestra.findMany({
      include: {
        subscription: true,
        metrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })

    // Calculate totals from latest metrics
    const totals = orchestras.reduce((acc, orchestra) => {
      const latestMetric = orchestra.metrics[0]
      if (latestMetric) {
        acc.totalMusicians += latestMetric.totalMusicians
        acc.activeMusicians += latestMetric.activeMusicians
        acc.totalProjects += latestMetric.totalProjects
        acc.activeProjects += latestMetric.activeProjects
        acc.totalRequests += latestMetric.totalRequests
        acc.acceptedRequests += latestMetric.acceptedRequests
      }
      return acc
    }, {
      totalMusicians: 0,
      activeMusicians: 0,
      totalProjects: 0,
      activeProjects: 0,
      totalRequests: 0,
      acceptedRequests: 0
    })

    // Calculate revenue
    const activeSubscriptions = orchestras.filter(o => o.subscription?.status === 'active')
    const totalMRR = activeSubscriptions.reduce((sum, o) => sum + (o.subscription?.pricePerMonth || 0), 0)

    // Get recent events
    const recentEvents = await prismaCentral.systemEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        orchestra: true
      }
    })

    return NextResponse.json({
      orchestras: orchestras.map(o => ({
        id: o.id,
        orchestraId: o.orchestraId,
        name: o.name,
        subdomain: o.subdomain,
        status: o.status,
        subscription: o.subscription,
        metrics: o.metrics
      })),
      metrics: totals,
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
  }
}