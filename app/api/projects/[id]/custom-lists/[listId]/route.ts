import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, listId: string }> }
) {
  try {
    const { id: projectId, listId } = await params
    const prisma = await getPrismaForUser(request)

    const customList = await prisma.customRankingList.findUnique({
      where: { 
        id: parseInt(listId),
        projectId: parseInt(projectId)
      },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        customRankings: {
          include: {
            musician: true
          },
          orderBy: {
            rank: 'asc'
          }
        },
        projectNeeds: true
      }
    })

    if (!customList) {
      return NextResponse.json(
        { error: 'Custom list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customList)
  } catch (error) {
    logger.error('api', 'Error fetching custom list', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Failed to fetch custom list' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, listId: string }> }
) {
  try {
    const { id: projectId, listId } = await params
    const body = await request.json()
    const { musicians, name } = body

    if (!musicians || !Array.isArray(musicians)) {
      return NextResponse.json(
        { error: 'Musicians array is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrismaForUser(request)

    // Check if the list exists and belongs to this project
    const existingList = await prisma.customRankingList.findUnique({
      where: { 
        id: parseInt(listId),
        projectId: parseInt(projectId)
      }
    })

    if (!existingList) {
      return NextResponse.json(
        { error: 'Custom list not found' },
        { status: 404 }
      )
    }

    // Update the list in a transaction
    const updatedList = await prisma.$transaction(async (tx) => {
      // Delete existing rankings
      await tx.customRanking.deleteMany({
        where: { customListId: parseInt(listId) }
      })

      // Update list and create new rankings
      return await tx.customRankingList.update({
        where: { id: parseInt(listId) },
        data: {
          name: name || existingList.name,
          customRankings: {
            create: musicians.map((musicianId: number, index: number) => ({
              musicianId,
              rank: index + 1
            }))
          }
        },
        include: {
          customRankings: {
            include: {
              musician: true
            },
            orderBy: {
              rank: 'asc'
            }
          }
        }
      })
    })

    logger.info('api', 'Updated custom ranking list', {
      projectId,
      listId,
      metadata: {
        musicianCount: musicians.length
      }
    })

    return NextResponse.json(updatedList)
  } catch (error) {
    logger.error('api', 'Error updating custom list', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Failed to update custom list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, listId: string }> }
) {
  try {
    const { id: projectId, listId } = await params
    const prisma = await getPrismaForUser(request)

    // Check if the list exists and is not in use
    const customList = await prisma.customRankingList.findUnique({
      where: { 
        id: parseInt(listId),
        projectId: parseInt(projectId)
      },
      include: {
        projectNeeds: true
      }
    })

    if (!customList) {
      return NextResponse.json(
        { error: 'Custom list not found' },
        { status: 404 }
      )
    }

    // Check if the list is being used by any project needs
    if (customList.projectNeeds.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete custom list that is in use' },
        { status: 400 }
      )
    }

    // Delete the list (cascade will delete rankings)
    await prisma.customRankingList.delete({
      where: { id: parseInt(listId) }
    })

    logger.info('api', 'Deleted custom ranking list', {
      projectId,
      listId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('api', 'Error deleting custom list', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Failed to delete custom list' },
      { status: 500 }
    )
  }
}