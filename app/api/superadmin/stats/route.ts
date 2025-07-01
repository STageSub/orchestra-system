import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(request: NextRequest) {
  try {
    // Verify superadmin
    const token = await getAuthCookie()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prismaMultitenant.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get stats
    const [totalTenants, totalUsers, subscriptionStats] = await Promise.all([
      prismaMultitenant.tenant.count(),
      prismaMultitenant.user.count(),
      prismaMultitenant.tenant.groupBy({
        by: ['subscriptionStatus'],
        _count: true
      })
    ])
    
    const activeTenants = subscriptionStats
      .filter(s => s.subscriptionStatus === 'active' || s.subscriptionStatus === 'trialing')
      .reduce((sum, s) => sum + s._count, 0)
    
    // Calculate mock revenue (will be real when Stripe is integrated)
    const revenueByTier = {
      small_ensemble: 79,
      medium_ensemble: 499,
      institution: 1500
    }
    
    const tenantsByTier = await prismaMultitenant.tenant.groupBy({
      by: ['subscription'],
      where: {
        subscriptionStatus: 'active'
      },
      _count: true
    })
    
    const totalRevenue = tenantsByTier.reduce((sum, tier) => {
      const price = revenueByTier[tier.subscription as keyof typeof revenueByTier] || 0
      return sum + (price * tier._count)
    }, 0)
    
    // Mock growth rate
    const growthRate = 15.3
    
    // Get alerts
    const alerts = []
    
    // Check for tenants approaching limits
    const tenantsWithUsage = await prismaMultitenant.tenant.findMany({
      where: {
        subscriptionStatus: { in: ['active', 'trialing'] }
      },
      include: {
        _count: {
          select: {
            musicians: true,
            projects: true,
            instruments: true
          }
        }
      }
    })
    
    tenantsWithUsage.forEach((tenant) => {
      const musicianCount = tenant._count.musicians
      const projectCount = tenant._count.projects
      const instrumentCount = tenant._count.instruments
      
      // Check musicians limit
      if (tenant.maxMusicians > 0 && musicianCount >= tenant.maxMusicians * 0.9) {
        alerts.push({
          id: `musician-limit-${tenant.id}`,
          type: musicianCount >= tenant.maxMusicians ? 'error' as const : 'warning' as const,
          message: `${musicianCount >= tenant.maxMusicians ? 'Musikergränsen nådd' : 'Närmar sig musikergränsen'} (${musicianCount}/${tenant.maxMusicians})`,
          tenantName: tenant.name
        })
      }
      
      // Check projects limit
      if (tenant.maxActiveProjects > 0 && projectCount >= tenant.maxActiveProjects * 0.9) {
        alerts.push({
          id: `project-limit-${tenant.id}`,
          type: projectCount >= tenant.maxActiveProjects ? 'error' as const : 'warning' as const,
          message: `${projectCount >= tenant.maxActiveProjects ? 'Projektgränsen nådd' : 'Närmar sig projektgränsen'} (${projectCount}/${tenant.maxActiveProjects})`,
          tenantName: tenant.name
        })
      }
      
      // Check instruments limit
      if (tenant.maxInstruments > 0 && instrumentCount >= tenant.maxInstruments * 0.9) {
        alerts.push({
          id: `instrument-limit-${tenant.id}`,
          type: instrumentCount >= tenant.maxInstruments ? 'error' as const : 'warning' as const,
          message: `${instrumentCount >= tenant.maxInstruments ? 'Instrumentgränsen nådd' : 'Närmar sig instrumentgränsen'} (${instrumentCount}/${tenant.maxInstruments})`,
          tenantName: tenant.name
        })
      }
    })
    
    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalRevenue,
      growthRate,
      alerts
    })
    
  } catch (error) {
    console.error('Superadmin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}