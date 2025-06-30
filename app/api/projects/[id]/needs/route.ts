import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const needs = await prisma.projectNeed.findMany({
      where: { projectId: parseInt(id) },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true,
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
    
    return NextResponse.json(sortedNeeds)
  } catch (error) {
    console.error('Error fetching project needs:', error)
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
    const { id } = await context.params
    const body = await request.json()
    const { positionId, rankingListId, quantity, requestStrategy, maxRecipients, responseTimeHours, requireLocalResidence } = body
    
    const parsedQuantity = parseInt(quantity)
    const parsedMaxRecipients = maxRecipients ? parseInt(maxRecipients) : null
    
    // Validation 1: Sequential strategy must have quantity = 1
    if (requestStrategy === 'sequential' && parsedQuantity !== 1) {
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
    
    // Validation 5: Check available musicians in ranking list
    const musiciansInList = await prisma.musician.findMany({
      where: {
        isActive: true,
        isArchived: false,
        rankings: {
          some: { listId: parseInt(rankingListId) }
        }
      },
      select: { id: true }
    })
    
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
    const projectNeedId = await generateUniqueId('projectNeed')
    
    const need = await prisma.projectNeed.create({
      data: {
        projectNeedId,
        projectId: parseInt(id),
        positionId: parseInt(positionId),
        rankingListId: parseInt(rankingListId),
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
        _count: {
          select: {
            requests: true
          }
        }
      }
    })
    
    return NextResponse.json(need, { status: 201 })
  } catch (error) {
    console.error('Error creating project need:', error)
    return NextResponse.json(
      { error: 'Failed to create project need' },
      { status: 500 }
    )
  }
}