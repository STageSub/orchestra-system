import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rankingList = await prisma.rankingList.findUnique({
      where: { id: parseInt(id) },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankings: {
          orderBy: { rank: 'asc' },
          include: {
            musician: true
          }
        }
      }
    })

    if (!rankingList) {
      return NextResponse.json(
        { error: 'Rankningslista hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json(rankingList)
  } catch (error) {
    console.error('Error fetching ranking list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking list' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const { description } = body

    const updatedList = await prisma.rankingList.update({
      where: { id: parseInt(id) },
      data: { description }
    })

    return NextResponse.json(updatedList)
  } catch (error) {
    console.error('Error updating ranking list:', error)
    return NextResponse.json(
      { error: 'Failed to update ranking list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if ranking list has any musicians
    const rankingList = await prisma.rankingList.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { rankings: true }
        }
      }
    })
    
    if (!rankingList) {
      return NextResponse.json(
        { error: 'Rankningslista hittades inte' },
        { status: 404 }
      )
    }
    
    if (rankingList._count.rankings > 0) {
      return NextResponse.json(
        { error: 'Kan inte ta bort rankningslista som innehåller musiker' },
        { status: 400 }
      )
    }
    
    // Simply delete the ranking list - cascade will handle rankings
    await prisma.rankingList.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ranking list:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort rankningslista' },
      { status: 500 }
    )
  }
}