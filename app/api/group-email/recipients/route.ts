import { NextRequest, NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const instrumentIds = searchParams.getAll('instrumentId')
    const positionIds = searchParams.getAll('positionId')

    console.log('[Group Email Recipients] Request params:', {
      projectId,
      instrumentIds,
      positionIds
    })

    // Project is required
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Build where clause - always filter by accepted status for the project
    const where = {
      isActive: true,
      requests: {
        some: {
          projectNeed: {
            projectId: parseInt(projectId)
          },
          status: 'accepted' // Always only accepted musicians
        }
      }
    }

    // Get musicians with their accepted requests for this project
    const musicians = await prismaMultitenant.musician.findMany({
      where,
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
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    console.log(`[Group Email Recipients] Found ${musicians.length} musicians with accepted requests for project ${projectId}`)

    // Filter by instruments/positions if specified
    let filteredMusicians = musicians
    
    if (instrumentIds.length > 0 || positionIds.length > 0) {
      console.log('[Group Email Recipients] Applying filters...')
      filteredMusicians = filteredMusicians.filter(musician => {
        // If both filters are specified, musician must match at least one from each
        const matchesInstrument = instrumentIds.length === 0 || 
          musician.requests.some(request => 
            instrumentIds.includes(request.projectNeed.position.instrumentId.toString())
          )
        
        const matchesPosition = positionIds.length === 0 || 
          musician.requests.some(request => 
            positionIds.includes(request.projectNeed.positionId.toString())
          )
        
        return matchesInstrument && matchesPosition
      })
      console.log(`[Group Email Recipients] After filtering: ${filteredMusicians.length} musicians`)
    }

    // Transform data for the frontend
    const recipients = filteredMusicians.map(musician => {
      // Get all accepted positions for this musician in this project
      const acceptedPositions = musician.requests.map(request => ({
        instrument: request.projectNeed.position.instrument.name,
        instrumentId: request.projectNeed.position.instrument.id,
        instrumentOrder: request.projectNeed.position.instrument.displayOrder ?? 999,
        position: request.projectNeed.position.name,
        positionId: request.projectNeed.position.id,
        positionHierarchy: request.projectNeed.position.hierarchyLevel
      }))

      // Create a summary of what they accepted
      const acceptedFor = acceptedPositions
        .map(p => `${p.instrument} - ${p.position}`)
        .join(', ')

      return {
        id: musician.id,
        name: `${musician.firstName} ${musician.lastName}`,
        email: musician.email,
        instrument: acceptedPositions[0]?.instrument || '',
        instrumentId: acceptedPositions[0]?.instrumentId || 0,
        instrumentOrder: acceptedPositions[0]?.instrumentOrder || 999,
        position: acceptedPositions[0]?.position || '',
        positionId: acceptedPositions[0]?.positionId || 0,
        positionHierarchy: acceptedPositions[0]?.positionHierarchy || 999,
        acceptedFor
      }
    })

    // Sort recipients by instrument order, then position hierarchy, then by name
    const sortedRecipients = recipients.sort((a, b) => {
      // 1. Sort by instrument order first
      if (a.instrumentOrder !== b.instrumentOrder) {
        return a.instrumentOrder - b.instrumentOrder
      }
      // 2. Then by position hierarchy within each instrument
      if (a.positionHierarchy !== b.positionHierarchy) {
        return a.positionHierarchy - b.positionHierarchy
      }
      // 3. Finally by name alphabetically
      return a.name.localeCompare(b.name)
    })

    console.log(`[Group Email Recipients] Returning ${sortedRecipients.length} recipients`)
    return NextResponse.json(sortedRecipients)
  } catch (error) {
    console.error('[Group Email Recipients] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}