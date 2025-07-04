import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('positionId')
    const projectId = searchParams.get('projectId')
    
    const where = positionId ? { positionId: parseInt(positionId) } : {}
    
    let rankingLists = await prisma.rankingList.findMany({
      where,
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        _count: {
          select: {
            rankings: true
          }
        }
      },
      orderBy: [
        { positionId: 'asc' },
        { listType: 'asc' }
      ]
    })
    
    // Enhance ranking lists with available musician count
    const enhancedLists = await Promise.all(
      rankingLists.map(async (list) => {
        // Get musicians in this ranking list who are active
        const musiciansInList = await prisma.musician.findMany({
          where: {
            isActive: true,
            isArchived: false,
            rankings: {
              some: { listId: list.id }
            }
          },
          select: { id: true }
        })
        
        let availableMusiciansCount = musiciansInList.length
        
        // If projectId is provided, exclude musicians who already have requests in this project
        if (projectId) {
          const musiciansWithRequests = await prisma.request.findMany({
            where: {
              projectNeed: {
                projectId: parseInt(projectId)
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
          availableMusiciansCount = musiciansInList.filter(m => !excludedMusicianIds.has(m.id)).length
        }
        
        return {
          ...list,
          availableMusiciansCount,
          totalActiveMusicians: musiciansInList.length
        }
      })
    )
    
    // If projectId is provided, filter out already used ranking lists
    if (projectId) {
      const projectNeeds = await prisma.projectNeed.findMany({
        where: { projectId: parseInt(projectId) },
        select: { rankingListId: true }
      })
      
      const usedRankingListIds = new Set(projectNeeds.map(need => need.rankingListId))
      rankingLists = enhancedLists.map(list => ({
        ...list,
        isUsedInProject: usedRankingListIds.has(list.id)
      }))
    } else {
      rankingLists = enhancedLists
    }
    
    // Check if customRankingList table exists and include custom lists
    let customLists = []
    let hasCustomListTable = false
    
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      hasCustomListTable = true
    } catch (error) {
      // Table doesn't exist yet, skip custom lists
    }
    
    if (hasCustomListTable && projectId && positionId) {
      // Fetch custom lists for this project and position
      const projectCustomLists = await prisma.customRankingList.findMany({
        where: {
          projectId: parseInt(projectId),
          positionId: parseInt(positionId)
        },
        include: {
          _count: {
            select: {
              customRankings: true
            }
          }
        }
      })
      
      // Transform custom lists to match ranking list format
      customLists = await Promise.all(projectCustomLists.map(async customList => {
        // Get active musicians count
        const activeMusicians = await prisma.customRanking.findMany({
          where: {
            customListId: customList.id,
            musician: {
              isActive: true,
              isArchived: false
            }
          },
          select: { musicianId: true }
        })
        
        return {
          id: customList.id,
          listType: 'Anpassad',
          description: customList.name,
          positionId: customList.positionId,
          position: rankingLists[0]?.position, // Use position from standard lists
          availableMusiciansCount: activeMusicians.length,
          totalActiveMusicians: activeMusicians.length,
          isCustomList: true,
          customListId: customList.id
        }
      }))
    }
    
    // Combine standard and custom lists
    const allLists = [...rankingLists, ...customLists]
    
    return NextResponse.json(allLists)
  } catch (error) {
    console.error('Error fetching ranking lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking lists' },
      { status: 500 }
    )
  }
}