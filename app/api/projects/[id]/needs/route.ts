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
    const { positionId, rankingListId, quantity, requestStrategy, maxRecipients, responseTimeHours } = body
    
    // Generate unique project need ID
    const projectNeedId = await generateUniqueId('projectNeed')
    
    const need = await prisma.projectNeed.create({
      data: {
        projectNeedId,
        projectId: parseInt(id),
        positionId: parseInt(positionId),
        rankingListId: parseInt(rankingListId),
        quantity: parseInt(quantity),
        requestStrategy,
        maxRecipients: maxRecipients ? parseInt(maxRecipients) : null,
        responseTimeHours: responseTimeHours ? parseInt(responseTimeHours) : 24
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