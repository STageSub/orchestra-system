import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
    // Log needs fetch start
    await apiLogger.info(request, 'api', 'Fetching project needs', {
      metadata: {
        action: 'list_project_needs',
        projectId: id
      }
    })
    
    // Check if customRankingList table exists (for backwards compatibility)
    let includeCustomList = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      includeCustomList = true
    } catch (error) {
      // Table doesn't exist yet, skip including it
    }

    const needs = await prisma.projectNeed.findMany({
      where: { projectId: parseInt(id) },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true,
        ...(includeCustomList && { customRankingList: true }),
        _count: {
          select: {
            requests: true
          }
        }
      }
    })
    
    // Sort needs by instrument displayOrder and then by position hierarchyLevel
    const sortedNeeds = needs.sort((a, b) => {
      const orderA = a.position.instrument.displayOrder ?? 999
      const orderB = b.position.instrument.displayOrder ?? 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      return a.position.hierarchyLevel - b.position.hierarchyLevel
    })
    
    // Log successful fetch
    await apiLogger.info(request, 'api', 'Project needs fetched successfully', {
      metadata: {
        action: 'list_project_needs',
        projectId: id,
        needsCount: sortedNeeds.length
      }
    })
    
    return NextResponse.json(sortedNeeds)
  } catch (error) {
    console.error('Error fetching project needs:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch project needs: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'list_project_needs',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch project needs' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    const body = await request.json()
    const { positionId, rankingListId, customRankingListId, quantity, requestStrategy, maxRecipients, responseTimeHours, requireLocalResidence } = body
    
    // Log project need creation start
    await apiLogger.info(request, 'api', 'Creating project need', {
      metadata: {
        action: 'create_project_need',
        projectId: id,
        positionId,
        quantity,
        requestStrategy
      }
    })
    
    // Check if customRankingList table exists (for backwards compatibility)
    let includeCustomList = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      includeCustomList = true
    } catch (error) {
      // Table doesn't exist yet, skip including it
    }
    
    const parsedQuantity = parseInt(quantity)
    const parsedMaxRecipients = maxRecipients ? parseInt(maxRecipients) : null
    
    // Validation 1: Sequential strategy must have quantity = 1
    if (requestStrategy === 'sequential' && parsedQuantity !== 1) {
      await apiLogger.warn(request, 'api', 'Invalid sequential strategy quantity', {
        metadata: {
          action: 'create_project_need',
          projectId: id,
          requestStrategy,
          quantity: parsedQuantity
        }
      })
      return NextResponse.json(
        { error: 'Sekventiell strategi måste ha antal = 1' },
        { status: 400 }
      )
    }
    
    // Validation 2: Parallel strategy must have quantity >= 2
    if (requestStrategy === 'parallel' && parsedQuantity < 2) {
      return NextResponse.json(
        { error: 'Parallell strategi kräver minst 2 behov' },
        { status: 400 }
      )
    }
    
    // Validation 3: First come strategy maxRecipients must be >= quantity
    if (requestStrategy === 'first_come' && parsedMaxRecipients && parsedMaxRecipients < parsedQuantity) {
      return NextResponse.json(
        { error: `Max antal mottagare måste vara minst ${parsedQuantity} (antal behov)` },
        { status: 400 }
      )
    }
    
    // Validation 4: Check if position has any qualified musicians
    const qualifiedMusicians = await prisma.musician.count({
      where: {
        isActive: true,
        isArchived: false,
        qualifications: {
          some: { positionId: parseInt(positionId) }
        }
      }
    })
    
    if (qualifiedMusicians === 0) {
      return NextResponse.json(
        { error: 'Det finns inga kvalificerade musiker för denna position' },
        { status: 400 }
      )
    }
    
    // Validation 5: Check if either rankingListId or customRankingListId is provided
    if (!rankingListId && !customRankingListId) {
      return NextResponse.json(
        { error: 'En rankningslista måste väljas' },
        { status: 400 }
      )
    }
    
    // Check available musicians based on list type
    let musiciansInList
    if (rankingListId) {
      // Standard ranking list
      musiciansInList = await prisma.musician.findMany({
        where: {
          isActive: true,
          isArchived: false,
          rankings: {
            some: { listId: parseInt(rankingListId) }
          }
        },
        select: { id: true }
      })
    } else if (customRankingListId && includeCustomList) {
      // Custom ranking list (only if table exists)
      musiciansInList = await prisma.musician.findMany({
        where: {
          isActive: true,
          isArchived: false,
          customRankings: {
            some: { customListId: parseInt(customRankingListId) }
          }
        },
        select: { id: true }
      })
    } else {
      // Fallback: if custom list specified but table doesn't exist
      musiciansInList = []
    }
    
    // Exclude musicians who already have requests in this project
    const musiciansWithRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: parseInt(id)
        },
        musicianId: {
          in: musiciansInList.map(m => m.id)
        }
      },
      select: {
        musicianId: true
      },
      distinct: ['musicianId']
    })
    
    const excludedMusicianIds = new Set(musiciansWithRequests.map(r => r.musicianId))
    const availableMusicians = musiciansInList.filter(m => !excludedMusicianIds.has(m.id))
    
    if (availableMusicians.length === 0) {
      return NextResponse.json(
        { error: 'Det finns inga tillgängliga musiker i den valda rankningslistan' },
        { status: 400 }
      )
    }
    
    if (parsedQuantity > availableMusicians.length) {
      return NextResponse.json(
        { error: `Antal behov (${parsedQuantity}) är högre än tillgängliga musiker (${availableMusicians.length})` },
        { status: 400 }
      )
    }
    
    // Generate unique project need ID
    const projectNeedId = await generateUniqueId('projectNeed', prisma)
    
    const need = await prisma.projectNeed.create({
      data: {
        projectNeedId,
        projectId: parseInt(id),
        positionId: parseInt(positionId),
        rankingListId: rankingListId ? parseInt(rankingListId) : null,
        customRankingListId: customRankingListId ? parseInt(customRankingListId) : null,
        quantity: parsedQuantity,
        requestStrategy,
        maxRecipients: parsedMaxRecipients,
        responseTimeHours: responseTimeHours ? parseInt(responseTimeHours) : 24,
        requireLocalResidence: requireLocalResidence || false
      },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true,
        ...(includeCustomList && { customRankingList: true }),
        _count: {
          select: {
            requests: true
          }
        }
      }
    })
    
    // Log successful creation
    await apiLogger.info(request, 'api', 'Project need created successfully', {
      metadata: {
        action: 'create_project_need',
        projectId: id,
        projectNeedId: need.projectNeedId,
        positionId: need.positionId,
        quantity: need.quantity,
        requestStrategy: need.requestStrategy
      }
    })
    
    return NextResponse.json(need, { status: 201 })
  } catch (error) {
    console.error('Error creating project need:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to create project need: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'create_project_need',
        projectId: id,
        error: error instanceof Error ? error.message : String(error),
        requestData: body
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to create project need' },
      { status: 500 }
    )
  }
}