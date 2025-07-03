import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
  const prisma = await getPrismaForUser(request)
    const { projectId } = await context.params
    const projectIdNum = parseInt(projectId)

    console.log('[DEBUG] Checking accepted musicians for project:', projectIdNum)

    // First, check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum }
    })

    if (!project) {
      return NextResponse.json({
        error: 'Project not found',
        projectId: projectIdNum
      })
    }

    // Get all requests for this project
    const allRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: projectIdNum
        }
      },
      include: {
        musician: true,
        projectNeed: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      }
    })

    // Get accepted requests
    const acceptedRequests = allRequests.filter(r => r.status === 'accepted')

    // Get unique musicians with accepted status
    const uniqueAcceptedMusicians = new Map()
    acceptedRequests.forEach(req => {
      if (!uniqueAcceptedMusicians.has(req.musicianId)) {
        uniqueAcceptedMusicians.set(req.musicianId, {
          id: req.musician.id,
          name: `${req.musician.firstName} ${req.musician.lastName}`,
          email: req.musician.email,
          isActive: req.musician.isActive,
          acceptedFor: []
        })
      }
      uniqueAcceptedMusicians.get(req.musicianId).acceptedFor.push({
        position: req.projectNeed.position.name,
        instrument: req.projectNeed.position.instrument.name
      })
    })

    const result = {
      project: {
        id: project.id,
        name: project.name,
        type: project.type
      },
      totalRequests: allRequests.length,
      requestsByStatus: {
        accepted: allRequests.filter(r => r.status === 'accepted').length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        declined: allRequests.filter(r => r.status === 'declined').length,
        cancelled: allRequests.filter(r => r.status === 'cancelled').length
      },
      acceptedMusicians: Array.from(uniqueAcceptedMusicians.values()),
      debug: {
        allStatuses: [...new Set(allRequests.map(r => r.status))],
        sampleRequests: allRequests.slice(0, 5).map(r => ({
          id: r.id,
          status: r.status,
          musician: `${r.musician.firstName} ${r.musician.lastName}`,
          musicianIsActive: r.musician.isActive,
          position: `${r.projectNeed.position.instrument.name} - ${r.projectNeed.position.name}`
        }))
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}