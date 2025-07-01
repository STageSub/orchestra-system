import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    // Get all project needs with their ranking lists
    const projectNeeds = await prismaMultitenant.projectNeed.findMany({
      where: { projectId },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: {
          include: {
            rankings: {
              include: {
                musician: true
              }
            }
          }
        }
      }
    })
    
    // Build a map of musicians to their positions across all needs
    const musicianPositionMap = new Map<number, Array<{
      need: typeof projectNeeds[0]
      ranking: number
    }>>()
    
    // Populate the map with all musicians and their positions
    projectNeeds.forEach(need => {
      if (need.rankingList?.rankings) {
        need.rankingList.rankings.forEach(ranking => {
          const musicianId = ranking.musicianId
          if (!musicianPositionMap.has(musicianId)) {
            musicianPositionMap.set(musicianId, [])
          }
          musicianPositionMap.get(musicianId)!.push({
            need,
            ranking: ranking.position
          })
        })
      }
    })
    
    // Find musicians that appear in multiple needs (conflicts)
    const conflicts = []
    
    musicianPositionMap.forEach((positions, musicianId) => {
      if (positions.length > 1) {
        // Get musician details from first position
        const musician = positions[0].need.rankingList?.rankings.find(
          r => r.musicianId === musicianId
        )?.musician
        
        if (musician) {
          conflicts.push({
            musician,
            positions: positions.map(p => ({
              needId: p.need.id,
              position: p.need.position,
              listType: p.need.rankingList?.listType || '',
              ranking: p.ranking,
              quantity: p.need.quantity
            }))
          })
        }
      }
    })
    
    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error('Error checking conflicts:', error)
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}