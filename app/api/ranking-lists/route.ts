import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
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
    
    // If projectId is provided, filter out already used ranking lists
    if (projectId) {
      const projectNeeds = await prisma.projectNeed.findMany({
        where: { projectId: parseInt(projectId) },
        select: { rankingListId: true }
      })
      
      const usedRankingListIds = new Set(projectNeeds.map(need => need.rankingListId))
      rankingLists = rankingLists.map(list => ({
        ...list,
        isUsedInProject: usedRankingListIds.has(list.id)
      }))
    }
    
    return NextResponse.json(rankingLists)
  } catch (error) {
    console.error('Error fetching ranking lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking lists' },
      { status: 500 }
    )
  }
}