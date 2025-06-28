import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return NextResponse.json(ranking, { status: 201 })
  } catch (error) {
    console.error('Error adding musician to ranking:', error)
    return NextResponse.json(
      { error: 'Failed to add musician to ranking' },
      { status: 500 }
    )
  }
}