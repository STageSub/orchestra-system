import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET() {
  try {
    // Initialize stats object
    const stats = {
      totalMusicians: 0,
      activeMusicians: 0,
      activeProjects: 0,
      totalRequests: 0,
      pendingResponses: 0,
      remindersCount: 0,
      responseRate: 0
    }

    // Get musician stats
    const [totalMusicians, activeMusicians] = await Promise.all([
      prismaMultitenant.musician.count(),
      prismaMultitenant.musician.count({ where: { isActive: true } })
    ])
    
    stats.totalMusicians = totalMusicians
    stats.activeMusicians = activeMusicians

    // Get project stats - active projects are those with future start dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    stats.activeProjects = await prismaMultitenant.project.count({
      where: {
        startDate: {
          gte: today
        }
      }
    })

    // Get request stats
    const [totalRequests, pendingResponses] = await Promise.all([
      prismaMultitenant.request.count(),
      prismaMultitenant.request.count({ where: { status: 'pending' } })
    ])
    
    stats.totalRequests = totalRequests
    stats.pendingResponses = pendingResponses

    // Get reminder count
    const requestsWithReminders = await prismaMultitenant.request.findMany({
      where: {
        NOT: {
          reminderSentAt: null
        }
      }
    })
    stats.remindersCount = requestsWithReminders.length

    // Calculate response rate for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentRequests = await prismaMultitenant.request.findMany({
      where: {
        sentAt: { gte: thirtyDaysAgo }
      },
      select: {
        status: true
      }
    })

    const respondedCount = recentRequests.filter(r => r.status !== 'pending').length
    stats.responseRate = recentRequests.length > 0 
      ? Math.round((respondedCount / recentRequests.length) * 100)
      : 0

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in dashboard stats API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}