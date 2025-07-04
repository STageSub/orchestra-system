import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { handleDeclinedRequest } from '@/lib/request-handlers'
import { generateUniqueId } from '@/lib/id-generator'
import { requireTestAccess } from '@/lib/test-auth-middleware'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // Check test access
  const authResult = await requireTestAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const prisma = await getPrismaForUser(request)
    const { requestId, response } = await request.json()

    const req = await prisma.request.findUnique({
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

    logger.info('test', 'Simulating response for request', {
      userId: authResult.user.id,
      requestId,
      response: newStatus,
      metadata: {
        musicianId: req.musicianId,
        projectNeedId: req.projectNeedId
      }
    })

    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        respondedAt: new Date()
      }
    })

    // Check if need is fulfilled for first_come strategy
    if (response === 'accepted') {
      const updatedProjectNeed = await prisma.projectNeed.findUnique({
        where: { id: req.projectNeed.id },
        include: {
          requests: true
        }
      })

      const acceptedCount = updatedProjectNeed!.requests.filter(r => r.status === 'accepted').length

      if (acceptedCount >= updatedProjectNeed!.quantity && updatedProjectNeed!.requestStrategy === 'first_come') {
        // Cancel all pending requests for this need
        const pendingRequests = await prisma.request.findMany({
          where: {
            projectNeedId: updatedProjectNeed!.id,
            status: 'pending'
          }
        })

        if (pendingRequests.length > 0) {
          await prisma.request.updateMany({
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
            const communicationLogId = await generateUniqueId('communicationLog', prisma)
            await prisma.communicationLog.create({
              data: {
                communicationLogId,
                requestId: pendingReq.id,
                type: 'position_filled_notification',
                timestamp: new Date()
              }
            })
          }

          logger.info('test', 'Cancelled pending requests for filled position', {
            userId: authResult.user.id,
            projectNeedId: updatedProjectNeed!.id,
            metadata: {
              cancelledCount: pendingRequests.length,
              strategy: 'first_come',
              acceptedCount
            }
          })
        }
      }
    } else if (response === 'declined') {
      await handleDeclinedRequest(requestId)
      
      logger.info('test', 'Handled declined request', {
        userId: authResult.user.id,
        requestId,
        metadata: {
          projectNeedId: req.projectNeedId
        }
      })
    }

    const communicationLogId = await generateUniqueId('communicationLog', prisma)
    await prisma.communicationLog.create({
      data: {
        communicationLogId,
        requestId,
        type: 'response_simulated',
        timestamp: new Date()
      }
    })

    logger.info('test', 'Response simulation completed', {
      userId: authResult.user.id,
      requestId,
      response: newStatus
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('test', 'Error simulating response', {
      userId: authResult.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to simulate response' },
      { status: 500 }
    )
  }
}