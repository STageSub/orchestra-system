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
    const customListId = searchParams.get('customListId')

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrismaForUser(request)

    // Get all qualified musicians for this position
    const qualifiedMusicians = await prisma.musician.findMany({
      where: {
        isActive: true,
        isArchived: false,
        qualifications: {
          some: {
            positionId: parseInt(positionId)
          }
        }
      },
      include: {
        rankings: {
          where: {
            rankingList: {
              positionId: parseInt(positionId)
            }
          },
          include: {
            rankingList: {
              select: {
                listType: true
              }
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Get musicians already in the custom list if customListId is provided
    let customListMusicianIds: number[] = []
    if (customListId) {
      const customList = await prisma.customRankingList.findUnique({
        where: { id: parseInt(customListId) },
        include: {
          customRankings: {
            select: {
              musicianId: true
            }
          }
        }
      })
      customListMusicianIds = customList?.customRankings.map(r => r.musicianId) || []
    }

    // Format the response
    const musicians = qualifiedMusicians.map(musician => {
      // Get their list memberships
      const lists = musician.rankings.map(r => r.rankingList.listType).sort()
      const listStatus = lists.length > 0 ? lists.join('/') : '(ej listad)'
      
      return {
        id: musician.id,
        musicianId: musician.musicianId,
        firstName: musician.firstName,
        lastName: musician.lastName,
        email: musician.email,
        localResidence: musician.localResidence,
        listStatus,
        isInCustomList: customListMusicianIds.includes(musician.id)
      }
    })

    logger.info('api', 'Fetched available musicians for custom list', {
      projectId,
      positionId,
      customListId,
      metadata: {
        totalMusicians: musicians.length,
        inCustomList: musicians.filter(m => m.isInCustomList).length
      }
    })

    return NextResponse.json({ musicians })
  } catch (error) {
    logger.error('api', 'Error fetching available musicians', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch available musicians' },
      { status: 500 }
    )
  }
}