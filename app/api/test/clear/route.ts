import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    await prismaMultitenant.$transaction([
      prismaMultitenant.communicationLog.deleteMany({}),
      prismaMultitenant.requestToken.deleteMany({}),
      prismaMultitenant.request.deleteMany({}),
      // Reset ProjectNeed status back to active
      prismaMultitenant.projectNeed.updateMany({
        where: { status: 'completed' },
        data: { status: 'active' }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing test data:', error)
    return NextResponse.json(
      { error: 'Failed to clear test data' },
      { status: 500 }
    )
  }
}