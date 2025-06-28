import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { instruments } = body

    if (!Array.isArray(instruments)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Update all instruments in a transaction
    await prisma.$transaction(
      instruments.map(({ id, displayOrder }) =>
        prisma.instrument.update({
          where: { id },
          data: { displayOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering instruments:', error)
    return NextResponse.json(
      { error: 'Failed to reorder instruments' },
      { status: 500 }
    )
  }
}