import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Ta bort alla rankings för denna lista
    await prismaMultitenant.ranking.deleteMany({
      where: { listId: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing ranking list:', error)
    return NextResponse.json(
      { error: 'Failed to clear ranking list' },
      { status: 500 }
    )
  }
}