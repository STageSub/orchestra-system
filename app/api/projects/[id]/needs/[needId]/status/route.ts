import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const { needId } = await context.params
    const body = await request.json()
    const { status } = body

    if (!['active', 'paused', 'completed', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Ogiltig status' },
        { status: 400 }
      )
    }

    const updatedNeed = await prisma.projectNeed.update({
      where: { id: parseInt(needId) },
      data: { 
        status,
        ...(status === 'archived' && { archivedAt: new Date() })
      }
    })

    return NextResponse.json(updatedNeed)
  } catch (error) {
    console.error('Error updating need status:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera status' },
      { status: 500 }
    )
  }
}