import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; needId: string }> }
) {
  const { needId } = await params

  try {
    const prisma = await getPrismaForUser(request)
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        requests: {
          include: {
            musician: true
          },
          orderBy: {
            sentAt: 'desc'
          }
        },
        rankingList: {
          include: {
            rankings: {
              include: {
                musician: true
              },
              orderBy: {
                rank: 'asc'
              }
            }
          }
        }
      }
    })

    if (!need) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 })
    }

    // Get current request statuses
    const activeRequests = need.requests.filter(r => r.status === 'pending')
    const acceptedRequests = need.requests.filter(r => r.status === 'accepted')
    const declinedRequests = need.requests.filter(r => r.status === 'declined')
    const timedOutRequests = need.requests.filter(r => r.status === 'timed_out')

    // Get next musicians in queue
    const requestedMusicianIds = need.requests.map(r => r.musicianId)
    const nextInQueue = need.rankingList.rankings
      .filter(r => !requestedMusicianIds.includes(r.musicianId))
      .slice(0, 5) // Get next 5 musicians
      .map(r => ({
        id: r.musician.id,
        name: `${r.musician.firstName} ${r.musician.lastName}`,
        rank: r.rank
      }))

    // Prepare summary based on strategy
    let summary = {
      strategy: need.requestStrategy,
      maxRecipients: need.maxRecipients,
      quantity: need.quantity,
      accepted: acceptedRequests.length,
      pending: activeRequests.length,
      declined: declinedRequests.length,
      timedOut: timedOutRequests.length,
      activeRequests: activeRequests.slice(0, 5).map(r => ({
        id: r.id,
        musician: `${r.musician.firstName} ${r.musician.lastName}`,
        sentAt: r.sentAt
      })),
      acceptedRequests: acceptedRequests.map(r => ({
        id: r.id,
        musician: `${r.musician.firstName} ${r.musician.lastName}`,
        respondedAt: r.respondedAt
      })),
      declinedRequests: declinedRequests.map(r => ({
        id: r.id,
        musician: `${r.musician.firstName} ${r.musician.lastName}`,
        respondedAt: r.respondedAt
      })),
      timedOutRequests: timedOutRequests.map(r => ({
        id: r.id,
        musician: `${r.musician.firstName} ${r.musician.lastName}`,
        timedOutAt: r.updatedAt
      })),
      nextInQueue,
      totalInQueue: need.rankingList.rankings.length - requestedMusicianIds.length
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching request summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request summary' },
      { status: 500 }
    )
  }
}