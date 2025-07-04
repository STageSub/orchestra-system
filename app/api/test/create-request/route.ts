import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { getRecipientsForNeed } from '@/lib/recipient-selection'
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

    // Use the unified function to send requests
    logger.info('test', 'Creating test requests for need', {
      userId: authResult.user.id,
      needId: need.id,
      projectId: need.projectId,
      metadata: {
        currentRequests: beforeCount,
        quantity: need.quantity,
        acceptedCount
      }
    })

    await getRecipientsForNeed(need.id, {
      dryRun: false,
      includeDetails: false
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

    logger.info('test', 'Test requests created successfully', {
      userId: authResult.user.id,
      needId: need.id,
      metadata: {
        requestsCreated: newRequests.length,
        requestIds: newRequests.map(r => r.id)
      }
    })

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
    logger.error('test', 'Error creating test request', {
      userId: authResult.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create test request' },
      { status: 500 }
    )
  }
}