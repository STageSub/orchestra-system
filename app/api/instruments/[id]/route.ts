import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const instrument = await prismaMultitenant.instrument.findUnique({
      where: { id: parseInt(id) },
      include: {
        positions: {
          orderBy: { hierarchyLevel: 'asc' }
        }
      }
    })

    if (!instrument) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(instrument)
  } catch (error) {
    console.error('Error fetching instrument:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instrument' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, displayOrder, isArchived } = body

    const instrument = await prismaMultitenant.instrument.update({
      where: { id: parseInt(id) },
      data: {
        name,
        displayOrder,
        ...(isArchived !== undefined && { isArchived })
      }
    })

    return NextResponse.json(instrument)
  } catch (error) {
    console.error('Error updating instrument:', error)
    return NextResponse.json(
      { error: 'Failed to update instrument' },
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
    
    // Check if any musicians have this instrument
    const hasMusicians = await prismaMultitenant.musicianQualification.findFirst({
      where: {
        position: {
          instrumentId: parseInt(id)
        }
      }
    })

    if (hasMusicians) {
      return NextResponse.json(
        { error: 'Kan inte ta bort instrument som har musiker kopplade' },
        { status: 400 }
      )
    }

    // Simply delete the instrument - cascade will handle the rest
    await prismaMultitenant.instrument.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting instrument:', error)
    
    // More detailed error logging
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Instrumentet har kopplingar som blockerar borttagning. Kontrollera att inga projekt använder detta instrument.' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Instrumentet hittades inte' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: `Kunde inte ta bort instrumentet: ${error.message || 'Okänt fel'}` },
      { status: 500 }
    )
  }
}