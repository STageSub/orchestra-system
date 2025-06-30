import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const since = searchParams.get('since')
    
    if (!since) {
      return NextResponse.json(
        { error: 'Missing since parameter' },
        { status: 400 }
      )
    }
    
    const projectId = parseInt(id)
    const sinceDate = new Date(since)
    
    // Get all recent events for this project
    const events = []
    
    // Get recent responses for this project
    const recentResponses = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId
        },
        respondedAt: {
          gte: sinceDate
        },
        status: {
          in: ['accepted', 'declined', 'timeout']
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
      },
      orderBy: {
        respondedAt: 'asc'
      }
    })
    
    // Convert to events
    recentResponses.forEach(request => {
      let type: 'response_accepted' | 'response_declined' | 'request_timeout'
      
      switch (request.status) {
        case 'accepted':
          type = 'response_accepted'
          break
        case 'declined':
          type = 'response_declined'
          break
        case 'timeout':
          type = 'request_timeout'
          break
        default:
          return
      }
      
      events.push({
        type,
        musicianName: `${request.musician.firstName} ${request.musician.lastName}`,
        positionName: request.projectNeed.position.name,
        instrumentName: request.projectNeed.position.instrument.name,
        timestamp: request.respondedAt
      })
    })
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching project events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}