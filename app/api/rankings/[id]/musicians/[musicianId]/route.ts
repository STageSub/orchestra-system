import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; musicianId: string }> }
) {
  try {
    const { id, musicianId } = await params
    
    // Find the ranking entry
    const ranking = await prismaMultitenant.ranking.findFirst({
      where: {
        listId: parseInt(id),
        id: parseInt(musicianId)
      }
    })
    
    if (!ranking) {
      return NextResponse.json(
        { error: 'Musiker hittades inte i listan' },
        { status: 404 }
      )
    }
    
    // Delete the ranking
    await prismaMultitenant.ranking.delete({
      where: { id: ranking.id }
    })
    
    // Reorder remaining rankings
    const remainingRankings = await prismaMultitenant.ranking.findMany({
      where: { listId: parseInt(id) },
      orderBy: { rank: 'asc' }
    })
    
    // Update ranks to be sequential
    await prismaMultitenant.$transaction(
      remainingRankings.map((r, index) =>
        prismaMultitenant.ranking.update({
          where: { id: r.id },
          data: { rank: index + 1 }
        })
      )
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing musician from list:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort musiker från listan' },
      { status: 500 }
    )
  }
}