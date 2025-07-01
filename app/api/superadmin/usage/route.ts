import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

const SUBSCRIPTION_LIMITS = {
  trial: {
    maxMusicians: 50,
    maxActiveProjects: 5,
    maxInstruments: 10,
    maxStorageMB: 100
  },
  small_ensemble: {
    maxMusicians: 50,
    maxActiveProjects: 5,
    maxInstruments: 10,
    maxStorageMB: 500
  },
  medium_ensemble: {
    maxMusicians: 200,
    maxActiveProjects: 20,
    maxInstruments: 999999, // Unlimited
    maxStorageMB: 2000
  },
  institution: {
    maxMusicians: 999999, // Unlimited
    maxActiveProjects: 999999, // Unlimited
    maxInstruments: 999999, // Unlimited
    maxStorageMB: 10000
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify superadmin access
    const token = request.cookies.get('orchestra-admin-session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all tenants with their usage data
    const tenants = await prismaMultitenant.tenant.findMany({
      include: {
        _count: {
          select: {
            musicians: true,
            projects: true,
            instruments: true,
            users: true
          }
        }
      }
    })

    // Calculate usage for each tenant
    const tenantUsage = await Promise.all(tenants.map(async (tenant) => {
      // Get active projects count (projects with future start date)
      const activeProjects = await prismaMultitenant.project.count({
        where: {
          tenantId: tenant.id,
          startDate: {
            gte: new Date()
          }
        }
      })

      // Get storage usage (simplified - count files * average size)
      const fileCount = await prismaMultitenant.projectFile.count({
        where: { project: { tenantId: tenant.id } }
      })
      const estimatedStorageMB = Math.round(fileCount * 2.5) // Assume 2.5MB average per file

      // Get request counts for current and last month
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)

      const lastMonthStart = new Date(currentMonthStart)
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)

      const currentMonthRequests = await prismaMultitenant.request.count({
        where: {
          projectNeed: {
            project: { tenantId: tenant.id }
          },
          sentAt: {
            gte: currentMonthStart
          }
        }
      })

      const lastMonthRequests = await prismaMultitenant.request.count({
        where: {
          projectNeed: {
            project: { tenantId: tenant.id }
          },
          sentAt: {
            gte: lastMonthStart,
            lt: currentMonthStart
          }
        }
      })

      // Get limits based on subscription
      const limits = SUBSCRIPTION_LIMITS[tenant.subscription as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.trial
      
      // Use custom limits if set
      const musicianLimit = tenant.maxMusicians || limits.maxMusicians
      const projectLimit = tenant.maxActiveProjects || limits.maxActiveProjects
      const instrumentLimit = tenant.maxInstruments || limits.maxInstruments
      const storageLimit = limits.maxStorageMB

      // Calculate percentages
      const musicianPercentage = Math.round((tenant._count.musicians / musicianLimit) * 100)
      const projectPercentage = Math.round((activeProjects / projectLimit) * 100)
      const instrumentPercentage = Math.round((tenant._count.instruments / instrumentLimit) * 100)
      const storagePercentage = Math.round((estimatedStorageMB / storageLimit) * 100)

      // Determine overall status
      const maxPercentage = Math.max(musicianPercentage, projectPercentage, instrumentPercentage)
      const status = maxPercentage >= 90 ? 'critical' : maxPercentage >= 80 ? 'warning' : 'healthy'

      // Calculate trend
      const trend = lastMonthRequests === 0 ? 0 : 
        Math.round(((currentMonthRequests - lastMonthRequests) / lastMonthRequests) * 100)

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        subscription: tenant.subscription,
        usage: {
          musicians: {
            current: tenant._count.musicians,
            limit: musicianLimit,
            percentage: musicianPercentage
          },
          projects: {
            current: activeProjects,
            limit: projectLimit,
            percentage: projectPercentage
          },
          instruments: {
            current: tenant._count.instruments,
            limit: instrumentLimit,
            percentage: instrumentPercentage
          },
          storage: {
            currentMB: estimatedStorageMB,
            limitMB: storageLimit,
            percentage: storagePercentage
          },
          requests: {
            currentMonth: currentMonthRequests,
            lastMonth: lastMonthRequests,
            trend
          }
        },
        status
      }
    }))

    return NextResponse.json(tenantUsage)
  } catch (error) {
    console.error('Usage monitoring error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}