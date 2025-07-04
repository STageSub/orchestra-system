import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('positionId')

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrismaForUser(request)

    // Get current project to determine the season
    const currentProject = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })

    if (!currentProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get current year to filter by season
    const currentYear = currentProject.startDate.getFullYear()
    
    // Get standard A/B/C lists for this position
    const standardLists = await prisma.rankingList.findMany({
      where: {
        positionId: parseInt(positionId)
      },
      include: {
        rankings: {
          include: {
            musician: true
          },
          orderBy: {
            rank: 'asc'
          }
        }
      }
    })

    // Check if customRankingList table exists
    let hasCustomListTable = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      hasCustomListTable = true
    } catch (error) {
      // Table doesn't exist yet
    }

    // Get custom lists from current season projects
    let customLists: any[] = []
    if (hasCustomListTable) {
      customLists = await prisma.customRankingList.findMany({
        where: {
          positionId: parseInt(positionId),
          project: {
            startDate: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              weekNumber: true
            }
          },
          customRankings: {
            include: {
              musician: true
            },
            orderBy: {
              rank: 'asc'
            }
          }
        },
        orderBy: {
          project: {
            weekNumber: 'asc'
          }
        }
      })
    }

    // Format the response
    const lists = {
      standardLists: standardLists.map(list => ({
        id: list.id,
        type: 'standard',
        name: `Lista ${list.listType}`,
        listType: list.listType,
        description: list.description,
        musicians: list.rankings.map(r => ({
          id: r.musician.id,
          musicianId: r.musician.musicianId,
          firstName: r.musician.firstName,
          lastName: r.musician.lastName,
          email: r.musician.email,
          rank: r.rank
        })),
        musicianCount: list.rankings.length
      })),
      customLists: customLists.map(list => ({
        id: list.id,
        type: 'custom',
        name: `V. ${list.project.weekNumber} ${list.project.name}`,
        projectId: list.project.id,
        weekNumber: list.project.weekNumber,
        musicians: list.customRankings.map(r => ({
          id: r.musician.id,
          musicianId: r.musician.musicianId,
          firstName: r.musician.firstName,
          lastName: r.musician.lastName,
          email: r.musician.email,
          rank: r.rank
        })),
        musicianCount: list.customRankings.length,
        availableCount: list.customRankings.filter(r => 
          r.musician.isActive && !r.musician.isArchived
        ).length
      }))
    }

    logger.info('api', 'Fetched existing lists for custom list creation', {
      projectId,
      positionId,
      metadata: {
        standardListCount: lists.standardLists.length,
        customListCount: lists.customLists.length
      }
    })

    return NextResponse.json(lists)
  } catch (error) {
    logger.error('api', 'Error fetching existing lists', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch existing lists' },
      { status: 500 }
    )
  }
}