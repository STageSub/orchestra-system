import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await params;
    const body = await request.json()
    const { musicianId } = body

    // Hämta högsta rank i listan
    const highestRank = await prisma.ranking.findFirst({
      where: { listId: parseInt(id) },
      orderBy: { rank: 'desc' },
      select: { rank: true }
    })

    const newRank = (highestRank?.rank || 0) + 1

    // Skapa ny ranking
    const ranking = await prisma.ranking.create({
      data: {
        listId: parseInt(id),
        musicianId: parseInt(musicianId),
        rank: newRank
      },
      include: {
        musician: true
      }
    })
    
    // Log the addition
    await apiLogger.info(request, 'system', 'Musician added to ranking list', {
      metadata: {
        rankingListId: parseInt(id),
        musicianId: parseInt(musicianId),
        musicianName: `${ranking.musician.firstName} ${ranking.musician.lastName}`,
        rank: newRank
      }
    })

    return NextResponse.json(ranking, { status: 201 })
  } catch (error) {
    console.error('Error adding musician to ranking:', error)
    
    // Log error
    await apiLogger.error(request, 'system', `Failed to add musician to ranking: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        rankingListId: parseInt((await params).id),
        musicianId: body?.musicianId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to add musician to ranking' },
      { status: 500 }
    )
  }
}