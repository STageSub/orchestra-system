import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRequests } from '@/lib/request-strategies'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Parse request body to get optional projectNeedId
  const body = await request.json().catch(() => ({}))
  const { projectNeedId } = body

  try {
    // Get project with all needs
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        projectNeeds: {
          include: {
            position: {
              include: {
                instrument: true
              }
            },
            requests: {
              where: {
                status: {
                  in: ['pending', 'accepted']
                }
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt hittades inte' },
        { status: 404 }
      )
    }

    let totalSent = 0
    const results = []

    // Process each need that requires requests
    for (const need of project.projectNeeds) {
      // Skip if specific need requested and this isn't it
      if (projectNeedId && need.id !== projectNeedId) continue
      
      // Skip paused needs
      if (need.status === 'paused') continue

      // Calculate how many are already accepted or pending
      const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
      const pendingCount = need.requests.filter(r => r.status === 'pending').length
      const totalActive = acceptedCount + pendingCount

      // Skip if already fully staffed
      if (totalActive >= need.quantity) continue

      try {
        // Send requests for this need
        await sendRequests({
          projectNeedId: need.id,
          strategy: need.requestStrategy as 'sequential' | 'parallel' | 'first_come',
          quantity: need.quantity,
          maxRecipients: need.maxRecipients || undefined,
          rankingListId: need.rankingListId || undefined
        })

        // Count how many new requests were created
        const newRequests = await prisma.request.count({
          where: {
            projectNeedId: need.id,
            status: 'pending',
            sentAt: {
              gte: new Date(Date.now() - 60000) // Created in the last minute
            }
          }
        })

        totalSent += newRequests
        results.push({
          needId: need.id,
          position: `${need.position.name} - ${need.position.instrument.name}`,
          sent: newRequests
        })
      } catch (error) {
        console.error(`Failed to send requests for need ${need.id}:`, error)
        results.push({
          needId: need.id,
          position: `${need.position.name} - ${need.position.instrument.name}`,
          sent: 0,
          error: 'Failed to send requests'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalSent,
      results,
      message: totalSent > 0 
        ? `${totalSent} förfrågningar skickades ut` 
        : 'Inga förfrågningar behövde skickas'
    })
  } catch (error) {
    console.error('Error sending requests:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid utskick av förfrågningar' },
      { status: 500 }
    )
  }
}