import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; needId: string }> }
) {
  const { id: projectId, needId } = await params

  try {
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        position: {
          include: {
            instrument: true
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
        },
        requests: {
          include: {
            musician: true
          }
        }
      }
    })

    if (!need) {
      return NextResponse.json({ error: 'Behov hittades inte' }, { status: 404 })
    }

    // Calculate current status
    const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
    const pendingCount = need.requests.filter(r => r.status === 'pending').length
    const remainingNeeded = Math.max(0, need.quantity - acceptedCount)

    // Get musicians already requested
    const requestedMusicianIds = need.requests.map(r => r.musicianId)
    
    // Get available musicians from ranking list
    const availableMusicians = need.rankingList.rankings
      .filter(r => !requestedMusicianIds.includes(r.musicianId))
      .map(r => ({
        id: r.musician.id,
        name: `${r.musician.firstName} ${r.musician.lastName}`,
        email: r.musician.email,
        rank: r.rank
      }))

    // Determine who would be contacted based on strategy
    let musiciansToContact: typeof availableMusicians = []
    let nextInQueue: typeof availableMusicians = []

    switch (need.requestStrategy) {
      case 'sequential':
        // Sequential: one at a time
        if (pendingCount === 0 && remainingNeeded > 0) {
          musiciansToContact = availableMusicians.slice(0, 1)
          nextInQueue = availableMusicians.slice(1, 4) // Next 3
        }
        break

      case 'parallel':
        // Parallel: as many as needed to reach quantity
        const toSend = remainingNeeded - pendingCount
        if (toSend > 0) {
          musiciansToContact = availableMusicians.slice(0, toSend)
          nextInQueue = availableMusicians.slice(toSend, toSend + 3)
        }
        break

      case 'first_come':
        // First come: up to maxRecipients at once
        if (pendingCount === 0 && remainingNeeded > 0) {
          const maxToSend = need.maxRecipients || remainingNeeded
          musiciansToContact = availableMusicians.slice(0, Math.min(maxToSend, remainingNeeded))
          nextInQueue = availableMusicians.slice(maxToSend, maxToSend + 3)
        }
        break
    }

    // Strategy explanation
    const strategyExplanation = {
      sequential: 'En musiker kontaktas åt gången. När musiker svarar nej skickas automatiskt till nästa.',
      parallel: `${remainingNeeded} musiker kontaktas för att fylla alla positioner. Vid avböjande fylls på automatiskt.`,
      first_come: `Upp till ${need.maxRecipients || remainingNeeded} musiker kontaktas samtidigt. Först till kvarn gäller.`
    }

    return NextResponse.json({
      need: {
        position: `${need.position.instrument.name} - ${need.position.name}`,
        quantity: need.quantity,
        currentStatus: {
          accepted: acceptedCount,
          pending: pendingCount,
          remaining: remainingNeeded
        }
      },
      strategy: {
        type: need.requestStrategy,
        explanation: strategyExplanation[need.requestStrategy] || ''
      },
      preview: {
        musiciansToContact,
        nextInQueue,
        totalAvailable: availableMusicians.length
      },
      canSend: musiciansToContact.length > 0
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera förhandsgranskning' },
      { status: 500 }
    )
  }
}