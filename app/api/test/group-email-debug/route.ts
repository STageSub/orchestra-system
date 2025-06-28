import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId') || '4'

  try {
    console.log('[GROUP EMAIL DEBUG] Starting debug for project:', projectId)

    // 1. Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })

    // 2. Get all requests for this project
    const allRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: parseInt(projectId)
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

    // 3. Get musicians using the same query as the recipients API
    const musicians = await prisma.musician.findMany({
      where: {
        status: 'active',
        requests: {
          some: {
            projectNeed: {
              projectId: parseInt(projectId)
            },
            status: 'accepted'
          }
        }
      },
      include: {
        requests: {
          where: {
            projectNeed: {
              projectId: parseInt(projectId)
            },
            status: 'accepted'
          },
          include: {
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
        }
      }
    })

    // 4. If no accepted requests, create test data
    let testDataCreated = false
    if (allRequests.filter(r => r.status === 'accepted').length === 0) {
      console.log('[GROUP EMAIL DEBUG] No accepted requests found, creating test data...')
      
      // Find a pending request to accept
      const pendingRequest = allRequests.find(r => r.status === 'pending')
      if (pendingRequest) {
        await prisma.request.update({
          where: { id: pendingRequest.id },
          data: {
            status: 'accepted',
            respondedAt: new Date()
          }
        })
        testDataCreated = true
        console.log('[GROUP EMAIL DEBUG] Updated request', pendingRequest.id, 'to accepted')
      }
    }

    // 5. Get instruments to check data structure
    const instruments = await prisma.instrument.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    // 6. Get positions to check data structure
    const positions = await prisma.position.findMany({
      include: { instrument: true }
    })

    const result = {
      project: project ? {
        id: project.id,
        name: project.name,
        type: project.type
      } : null,
      stats: {
        totalRequests: allRequests.length,
        acceptedRequests: allRequests.filter(r => r.status === 'accepted').length,
        pendingRequests: allRequests.filter(r => r.status === 'pending').length,
        activeMusicians: musicians.length
      },
      testDataCreated,
      dataTypes: {
        instrumentIdType: instruments.length > 0 ? typeof instruments[0].id : 'unknown',
        positionIdType: positions.length > 0 ? typeof positions[0].id : 'unknown',
        sampleInstrument: instruments[0] || null,
        samplePosition: positions[0] || null
      },
      sampleData: {
        requests: allRequests.slice(0, 3).map(r => ({
          id: r.id,
          status: r.status,
          musician: `${r.musician.firstName} ${r.musician.lastName}`,
          position: `${r.projectNeed.position.instrument.name} - ${r.projectNeed.position.name}`
        })),
        acceptedMusicians: musicians.map(m => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          email: m.email,
          acceptedPositions: m.requests.map(r => ({
            instrument: r.projectNeed.position.instrument.name,
            instrumentId: r.projectNeed.position.instrument.id,
            position: r.projectNeed.position.name
          }))
        }))
      }
    }

    console.log('[GROUP EMAIL DEBUG] Result:', JSON.stringify(result, null, 2))
    return NextResponse.json(result)
  } catch (error) {
    console.error('[GROUP EMAIL DEBUG] Error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}