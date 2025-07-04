import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const prisma = await getPrismaForUser(request)

    // Check if customRankingList table exists
    let hasCustomListTable = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      hasCustomListTable = true
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        (error as any)?.code === '42P01'
      )) {
        // Table doesn't exist yet
        return NextResponse.json({ customLists: [] })
      } else {
        throw error
      }
    }

    if (!hasCustomListTable) {
      return NextResponse.json({ customLists: [] })
    }

    // Fetch all custom lists for this project
    const customLists = await prisma.customRankingList.findMany({
      where: {
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
          }
        },
        projectNeeds: {
          select: {
            id: true,
            projectNeedId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response
    const formattedLists = customLists.map(list => ({
      id: list.id,
      customListId: list.customListId,
      name: list.name,
      position: {
        id: list.position.id,
        name: list.position.name,
        instrument: list.position.instrument.name
      },
      musicianCount: list.customRankings.length,
      isInUse: list.projectNeeds.length > 0,
      projectNeedsCount: list.projectNeeds.length,
      createdAt: list.createdAt,
      isTemplate: list.isTemplate,
      templateName: list.templateName
    }))

    return NextResponse.json({ customLists: formattedLists })
  } catch (error) {
    logger.error('api', 'Error fetching custom lists', {
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId: (await params).id
    })
    return NextResponse.json(
      { error: 'Failed to fetch custom lists' },
      { status: 500 }
    )
  }
}