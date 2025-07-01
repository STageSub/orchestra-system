import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { getCurrentTenant } from '@/lib/tenant-context'

const PLAN_LIMITS = {
  small_ensemble: {
    maxMusicians: 50,
    maxProjects: 5,
    maxInstruments: 10
  },
  medium_ensemble: {
    maxMusicians: 200,
    maxProjects: 20,
    maxInstruments: -1 // Unlimited
  },
  institution: {
    maxMusicians: -1,
    maxProjects: -1,
    maxInstruments: -1
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
    }

    // Get tenant info and usage counts
    const [tenant, musicianCount, projectCount, instrumentCount] = await Promise.all([
      prismaMultitenant.tenant.findUnique({
        where: { id: tenantId },
        select: { subscription: true }
      }),
      prismaMultitenant.musician.count({ where: { tenantId } }),
      prismaMultitenant.project.count({ where: { tenantId } }),
      prismaMultitenant.instrument.count({ where: { tenantId } })
    ])

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const limits = PLAN_LIMITS[tenant.subscription as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.small_ensemble

    return NextResponse.json({
      musicians: {
        current: musicianCount,
        limit: limits.maxMusicians
      },
      projects: {
        current: projectCount,
        limit: limits.maxProjects
      },
      instruments: {
        current: instrumentCount,
        limit: limits.maxInstruments
      }
    })

  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}