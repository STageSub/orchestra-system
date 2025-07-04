import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { requireTestAccess } from '@/lib/test-auth-middleware'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  // Check test access
  const authResult = await requireTestAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const prisma = await getPrismaForUser(request)
    
    logger.info('test', 'Clearing all test data', {
      userId: authResult.user.id
    })

    // Get counts before deletion for logging
    const [logCount, tokenCount, requestCount, needCount] = await Promise.all([
      prisma.communicationLog.count(),
      prisma.requestToken.count(),
      prisma.request.count(),
      prisma.projectNeed.count({ where: { status: 'completed' } })
    ])

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

    logger.info('test', 'Test data cleared successfully', {
      userId: authResult.user.id,
      metadata: {
        deletedCommunicationLogs: logCount,
        deletedRequestTokens: tokenCount,
        deletedRequests: requestCount,
        resetProjectNeeds: needCount
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('test', 'Error clearing test data', {
      userId: authResult.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to clear test data' },
      { status: 500 }
    )
  }
}