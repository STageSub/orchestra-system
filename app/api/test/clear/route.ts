import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const prisma = await getPrismaForUser(request)
    await prisma.$transaction([
      prisma.communicationLog.deleteMany({}),
      prisma.requestToken.deleteMany({}),
      prisma.request.deleteMany({}),
      // Reset ProjectNeed status back to active
      prisma.projectNeed.updateMany({
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