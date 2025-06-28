import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { positions } = body

    // Update all positions in a transaction
    await prisma.$transaction(
      positions.map((position: { id: number; hierarchyLevel: number }) =>
        prisma.position.update({
          where: { id: position.id },
          data: { hierarchyLevel: position.hierarchyLevel }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering positions:', error)
    return NextResponse.json(
      { error: 'Failed to reorder positions' },
      { status: 500 }
    )
  }
}