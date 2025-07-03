import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const prisma = await getPrismaForUser(request)
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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}