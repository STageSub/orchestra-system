import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRequests } from '@/lib/request-strategies'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { needId } = await request.json()

    const need = await prisma.projectNeed.findUnique({
      where: { id: needId },
      include: {
        requests: true
      }
    })

    if (!need) {
      return NextResponse.json(
        { error: 'Need not found' },
        { status: 404 }
      )
    }

    // Check if already fully staffed
    const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
    if (acceptedCount >= need.quantity) {
      return NextResponse.json(
        { error: 'Need is already fully staffed' },
        { status: 400 }
      )
    }

    // Get the count before sending
    const beforeCount = need.requests.length

    // Use the same sendRequests function as the real system
    await sendRequests({
      projectNeedId: need.id,
      strategy: need.requestStrategy as 'sequential' | 'parallel' | 'first_come',
      quantity: need.quantity,
      maxRecipients: need.maxRecipients || undefined,
      rankingListId: need.rankingListId || undefined
    })

    // Get updated need to see how many requests were created
    const updatedNeed = await prisma.projectNeed.findUnique({
      where: { id: needId },
      include: {
        requests: {
          include: {
            musician: true
          },
          orderBy: { sentAt: 'desc' }
        }
      }
    })

    const newRequests = updatedNeed!.requests.slice(0, updatedNeed!.requests.length - beforeCount)

    return NextResponse.json({
      message: `Created ${newRequests.length} test request(s)`,
      requests: newRequests.map(req => ({
        id: req.id,
        requestId: req.requestId,
        musician: {
          firstName: req.musician.firstName,
          lastName: req.musician.lastName,
          email: req.musician.email
        }
      }))
    })
  } catch (error) {
    console.error('Error creating test request:', error)
    return NextResponse.json(
      { error: 'Failed to create test request' },
      { status: 500 }
    )
  }
}