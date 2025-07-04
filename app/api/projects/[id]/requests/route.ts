import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
    // Log request fetch start
    await apiLogger.info(request, 'api', 'Fetching project requests', {
      metadata: {
        action: 'list_project_requests',
        projectId: id
      }
    })

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        projectNeeds: {
          include: {
            position: {
              include: {
                instrument: true
              }
            },
            rankingList: {
              include: {
                rankings: {
                  include: {
                    musician: true
                  },
                  orderBy: {
                    rank: 'asc'
                  }
                }
              }
            },
            customRankingList: true,
            requests: {
              include: {
                musician: true,
                communicationLogs: {
                  orderBy: { timestamp: 'desc' }
                }
              },
              orderBy: { sentAt: 'desc' }
            }
          }
        }
      }
    })

    if (!project) {
      await apiLogger.warn(request, 'api', 'Project not found for requests', {
        metadata: {
          action: 'list_project_requests',
          projectId: id
        }
      })
      return NextResponse.json(
        { error: 'Projekt hittades inte' },
        { status: 404 }
      )
    }

    const needsWithStatus = project.projectNeeds.map(need => {
      const requests = need.requests
      const acceptedCount = requests.filter(r => r.status === 'accepted').length
      const pendingCount = requests.filter(r => r.status === 'pending').length
      const declinedCount = requests.filter(r => r.status === 'declined').length
      const isFullyStaffed = acceptedCount >= need.quantity

      // Get next musicians in queue
      const requestedMusicianIds = requests.map(r => r.musicianId)
      const nextInQueue = need.rankingList?.rankings
        ?.filter(r => !requestedMusicianIds.includes(r.musicianId))
        .slice(0, 10) // Get next 10 musicians
        .map(r => ({
          id: r.musician.id,
          name: `${r.musician.firstName} ${r.musician.lastName}`,
          rank: r.rank
        })) || []

      return {
        id: need.id,
        projectNeedId: need.projectNeedId,
        position: {
          id: need.position.id,
          name: need.position.name,
          instrument: need.position.instrument.name
        },
        quantity: need.quantity,
        rankingList: need.rankingList ? {
          id: need.rankingList.id,
          listType: need.rankingList.listType
        } : null,
        customRankingList: need.customRankingList || null,
        requestStrategy: need.requestStrategy,
        maxRecipients: need.maxRecipients,
        responseTimeHours: need.responseTimeHours,
        needStatus: need.status,
        nextInQueue,
        totalInQueue: need.rankingList ? (need.rankingList.rankings.length - requestedMusicianIds.length) : 0,
        status: {
          acceptedCount,
          pendingCount,
          declinedCount,
          totalRequests: requests.length,
          isFullyStaffed,
          remainingNeeded: Math.max(0, need.quantity - acceptedCount)
        },
        // Add sort order for proper grouping
        sortOrder: isFullyStaffed ? 2 : (acceptedCount > 0 || pendingCount > 0) ? 1 : 0,
        requests: requests.map(req => ({
          id: req.id,
          requestId: req.requestId,
          musician: {
            id: req.musician.id,
            name: `${req.musician.firstName} ${req.musician.lastName}`,
            email: req.musician.email,
            phone: req.musician.phone
          },
          status: req.status,
          sentAt: req.sentAt,
          reminderSentAt: req.reminderSentAt,
          respondedAt: req.respondedAt,
          response: req.response,
          confirmationSent: req.confirmationSent,
          communicationHistory: req.communicationLogs.map(log => ({
            type: log.type,
            timestamp: log.timestamp
          }))
        }))
      }
    })

    // Sort needs: not started (0) -> active (1) -> fulfilled (2)
    const sortedNeeds = needsWithStatus.sort((a, b) => {
      // First sort by status group
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder
      }
      // Within same group, sort by instrument and position
      const instrumentCompare = a.position.instrument.localeCompare(b.position.instrument)
      if (instrumentCompare !== 0) return instrumentCompare
      return a.position.name.localeCompare(b.position.name)
    })

    // Log successful fetch
    const totalRequests = sortedNeeds.reduce((sum, need) => sum + need.requests.length, 0)
    await apiLogger.info(request, 'api', 'Project requests fetched successfully', {
      metadata: {
        action: 'list_project_requests',
        projectId: project.projectId,
        projectName: project.name,
        needsCount: sortedNeeds.length,
        totalRequests
      }
    })
    
    return NextResponse.json({
      project: {
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        startDate: project.startDate
      },
      needs: sortedNeeds
    })
  } catch (error) {
    console.error('Error fetching project requests:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch project requests: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'list_project_requests',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Kunde inte hämta förfrågningar' },
      { status: 500 }
    )
  }
}