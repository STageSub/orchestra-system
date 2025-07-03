import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; musicianId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, musicianId } = await params
    
    // Find the ranking entry
    const ranking = await prisma.ranking.findFirst({
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
    await prisma.ranking.delete({
      where: { id: ranking.id }
    })
    
    // Reorder remaining rankings
    const remainingRankings = await prisma.ranking.findMany({
      where: { listId: parseInt(id) },
      orderBy: { rank: 'asc' }
    })
    
    // Update ranks to be sequential
    await prisma.$transaction(
      remainingRankings.map((r, index) =>
        prisma.ranking.update({
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