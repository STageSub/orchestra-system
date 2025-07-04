import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { requireTestAccess } from '@/lib/test-auth-middleware'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // Check test access
  const authResult = await requireTestAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const prisma = await getPrismaForUser(request)
    
    logger.info('test', 'Fetching test request statistics', {
      userId: authResult.user.id
    })

    const stats = await prisma.request.groupBy({
      by: ['status'],
      _count: true
    })

    const result = {
      total: 0,
      pending: 0,
      accepted: 0,
      declined: 0,
      timedOut: 0,
      cancelled: 0
    }

    stats.forEach(stat => {
      result.total += stat._count
      switch (stat.status) {
        case 'pending':
          result.pending = stat._count
          break
        case 'accepted':
          result.accepted = stat._count
          break
        case 'declined':
          result.declined = stat._count
          break
        case 'timed_out':
          result.timedOut = stat._count
          break
        case 'cancelled':
          result.cancelled = stat._count
          break
      }
    })

    logger.info('test', 'Test statistics retrieved', {
      userId: authResult.user.id,
      metadata: result
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('test', 'Error fetching stats', {
      userId: authResult.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}