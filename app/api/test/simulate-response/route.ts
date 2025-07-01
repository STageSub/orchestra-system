import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { handleDeclinedRequest } from '@/lib/request-handlers'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { requestId, response } = await request.json()

    const req = await prismaMultitenant.request.findUnique({
      where: { id: requestId },
      include: {
        projectNeed: true
      }
    })

    if (!req) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (req.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is not pending' },
        { status: 400 }
      )
    }

    const newStatus = response === 'accepted' ? 'accepted' : 'declined'

    await prismaMultitenant.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        respondedAt: new Date()
      }
    })

    // Check if need is fulfilled for first_come strategy
    if (response === 'accepted') {
      const updatedProjectNeed = await prismaMultitenant.projectNeed.findUnique({
        where: { id: req.projectNeed.id },
        include: {
          requests: true
        }
      })

      const acceptedCount = updatedProjectNeed!.requests.filter(r => r.status === 'accepted').length

      if (acceptedCount >= updatedProjectNeed!.quantity && updatedProjectNeed!.requestStrategy === 'first_come') {
        // Cancel all pending requests for this need
        const pendingRequests = await prismaMultitenant.request.findMany({
          where: {
            projectNeedId: updatedProjectNeed!.id,
            status: 'pending'
          }
        })

        if (pendingRequests.length > 0) {
          await prismaMultitenant.request.updateMany({
            where: {
              projectNeedId: updatedProjectNeed!.id,
              status: 'pending'
            },
            data: { 
              status: 'cancelled',
              respondedAt: new Date()
            }
          })

          // Log cancellations
          for (const pendingReq of pendingRequests) {
            await prismaMultitenant.communicationLog.create({
              data: {
                requestId: pendingReq.id,
                type: 'position_filled_notification',
                timestamp: new Date()
              }
            })
          }

          console.log(`Cancelled ${pendingRequests.length} pending requests for filled position (first_come strategy)`)
        }
      }
    } else if (response === 'declined') {
      await handleDeclinedRequest(requestId)
    }

    await prismaMultitenant.communicationLog.create({
      data: {
        requestId,
        type: 'response_simulated',
        timestamp: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error simulating response:', error)
    return NextResponse.json(
      { error: 'Failed to simulate response' },
      { status: 500 }
    )
  }
}