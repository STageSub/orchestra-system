import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const projectId = parseInt(url.searchParams.get('projectId') || '4')

  try {
    const prisma = await getPrismaForUser(request)
    console.log('[ENSURE DATA] Checking project:', projectId)

    // 1. Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectNeeds: {
          include: {
            requests: {
              include: {
                musician: true
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' })
    }

    // 2. Find requests to accept
    let acceptedCount = 0
    const updates = []

    for (const need of project.projectNeeds) {
      const pendingRequests = need.requests.filter(r => r.status === 'pending')
      const acceptedRequests = need.requests.filter(r => r.status === 'accepted')
      
      // If no accepted requests, accept the first pending one
      if (acceptedRequests.length === 0 && pendingRequests.length > 0) {
        const toAccept = pendingRequests[0]
        await prisma.request.update({
          where: { id: toAccept.id },
          data: {
            status: 'accepted',
            respondedAt: new Date()
          }
        })
        updates.push({
          musician: `${toAccept.musician.firstName} ${toAccept.musician.lastName}`,
          need: need.id,
          requestId: toAccept.id
        })
        acceptedCount++
      }
    }

    // 3. Get updated stats
    const updatedRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: projectId
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

    const acceptedMusicians = updatedRequests
      .filter(r => r.status === 'accepted')
      .map(r => ({
        name: `${r.musician.firstName} ${r.musician.lastName}`,
        position: `${r.projectNeed.position.instrument.name} - ${r.projectNeed.position.name}`,
        email: r.musician.email
      }))

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name
      },
      updates,
      stats: {
        totalRequests: updatedRequests.length,
        acceptedBefore: updatedRequests.filter(r => r.status === 'accepted').length - acceptedCount,
        acceptedNow: updatedRequests.filter(r => r.status === 'accepted').length,
        newlyAccepted: acceptedCount
      },
      acceptedMusicians
    })
  } catch (error) {
    console.error('[ENSURE DATA] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to ensure data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}