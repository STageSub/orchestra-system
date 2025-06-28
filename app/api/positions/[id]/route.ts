import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    const position = await prisma.position.update({
      where: { id: parseInt(id) },
      data: { name }
    })

    return NextResponse.json(position)
  } catch (error) {
    console.error('Error updating position:', error)
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if any musicians have this qualification
    const hasMusicians = await prisma.musicianQualification.findFirst({
      where: { positionId: parseInt(id) }
    })

    if (hasMusicians) {
      return NextResponse.json(
        { error: 'Kan inte ta bort tjänst som har musiker kopplade' },
        { status: 400 }
      )
    }

    // Simply delete the position - cascade will handle the rest
    await prisma.position.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting position:', error)
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Tjänsten har kopplingar som blockerar borttagning' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tjänsten hittades inte' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: `Kunde inte ta bort tjänsten: ${error.message || 'Okänt fel'}` },
      { status: 500 }
    )
  }
}