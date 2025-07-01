import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

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
    await prismaMultitenant.$transaction(
      instruments.map(({ id, displayOrder }) =>
        prismaMultitenant.instrument.update({
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