import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        projectNeeds: {
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
          },
          where: {
            status: {
              not: 'paused'
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Projekt hittades inte' }, { status: 404 })
    }

    // Sort project needs by instrument displayOrder and position hierarchyLevel
    const sortedNeeds = project.projectNeeds.sort((a, b) => {
      const orderA = a.position.instrument.displayOrder ?? 999
      const orderB = b.position.instrument.displayOrder ?? 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      return a.position.hierarchyLevel - b.position.hierarchyLevel
    })

    const needsPreviews = []

    for (const need of sortedNeeds) {
      // Calculate current status
      const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
      const pendingCount = need.requests.filter(r => r.status === 'pending').length
      const totalActive = acceptedCount + pendingCount
      const remainingNeeded = Math.max(0, need.quantity - acceptedCount)

      // Skip if already fully staffed
      if (totalActive >= need.quantity) continue

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

      switch (need.requestStrategy) {
        case 'sequential':
          // Sequential: one at a time
          if (pendingCount === 0 && remainingNeeded > 0) {
            musiciansToContact = availableMusicians.slice(0, 1)
          }
          break

        case 'parallel':
          // Parallel: as many as needed to reach quantity
          const toSend = remainingNeeded - pendingCount
          if (toSend > 0) {
            musiciansToContact = availableMusicians.slice(0, toSend)
          }
          break

        case 'first_come':
          // First come: up to maxRecipients at once, or ALL if maxRecipients is null
          if (pendingCount === 0 && remainingNeeded > 0) {
            if (need.maxRecipients && need.maxRecipients > 0) {
              // When maxRecipients is set, use it
              musiciansToContact = availableMusicians.slice(0, Math.min(need.maxRecipients, availableMusicians.length))
            } else {
              // When maxRecipients is null/empty, send to ALL available musicians
              musiciansToContact = availableMusicians
            }
          }
          break
      }

      if (musiciansToContact.length > 0) {
        // Get next in queue (musicians not being contacted now)
        const nextInQueue = availableMusicians
          .filter(m => !musiciansToContact.some(mtc => mtc.id === m.id))
          .slice(0, 5) // Show next 5

        needsPreviews.push({
          needId: need.id,
          position: `${need.position.instrument.name} - ${need.position.name}`,
          quantity: need.quantity,
          currentStatus: {
            accepted: acceptedCount,
            pending: pendingCount,
            remaining: remainingNeeded
          },
          strategy: need.requestStrategy,
          maxRecipients: need.maxRecipients,
          musiciansToContact,
          nextInQueue,
          totalAvailable: availableMusicians.length
        })
      }
    }

    const totalToSend = needsPreviews.reduce((sum, need) => sum + need.musiciansToContact.length, 0)

    return NextResponse.json({
      project: {
        name: project.name,
        totalNeeds: project.projectNeeds.length
      },
      needsPreviews,
      totalToSend,
      canSend: totalToSend > 0
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera förhandsgranskning' },
      { status: 500 }
    )
  }
}