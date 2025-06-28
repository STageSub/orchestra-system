import { prisma } from '@/lib/prisma'
import { generateRequestToken } from '@/lib/request-tokens'
import { sendRequestEmail } from '@/lib/email'
import { generateUniqueId } from '@/lib/id-generator'

interface SendRequestsParams {
  projectNeedId: number
  strategy: 'sequential' | 'parallel' | 'first_come'
  quantity: number
  maxRecipients?: number
  rankingListId?: number
}

export async function sendRequests({
  projectNeedId,
  strategy,
  quantity,
  maxRecipients,
  rankingListId
}: SendRequestsParams) {
  const projectNeed = await prisma.projectNeed.findUnique({
    where: { id: projectNeedId },
    include: {
      requests: true,
      position: true
    }
  })

  if (!projectNeed) {
    throw new Error('Project need not found')
  }

  // Get existing requests
  const existingRequests = projectNeed.requests
  const acceptedCount = existingRequests.filter(r => r.status === 'accepted').length
  const pendingCount = existingRequests.filter(r => r.status === 'pending').length

  // Check if we already have enough accepted
  if (acceptedCount >= quantity) {
    console.log('Already have enough accepted musicians')
    return
  }

  console.log(`
=== SEND REQUESTS DEBUG ===
Strategy: ${strategy}
Quantity needed: ${quantity}
Accepted: ${acceptedCount}
Pending: ${pendingCount}
maxRecipients: ${maxRecipients}
rankingListId: ${rankingListId}
===========================`)

  // Get musicians to send requests to
  const musiciansToRequest = await getAvailableMusicians(
    projectNeedId,
    projectNeed.position.id,
    rankingListId
  )

  console.log(`Total available musicians: ${musiciansToRequest.length}`)
  console.log(`Available musician IDs: ${musiciansToRequest.map(m => m.id).join(', ')}`)

  // Filter out musicians who already have requests
  const existingMusicianIds = existingRequests.map(r => r.musicianId)
  console.log(`Musicians with existing requests: ${existingMusicianIds.join(', ')}`)
  
  const availableMusicians = musiciansToRequest.filter(
    m => !existingMusicianIds.includes(m.id)
  )

  console.log(`Musicians without existing requests: ${availableMusicians.length}`)
  console.log(`Available musician IDs after filtering: ${availableMusicians.map(m => m.id).join(', ')}`)

  if (availableMusicians.length === 0) {
    console.log('No available musicians to send requests to')
    return
  }

  // Determine how many requests to send based on strategy
  let musiciansToSend: typeof availableMusicians = []

  switch (strategy) {
    case 'sequential':
      // Send to one musician at a time
      if (pendingCount === 0) {
        musiciansToSend = availableMusicians.slice(0, 1)
      }
      break

    case 'parallel':
      // Send to enough musicians to maintain active requests equal to quantity needed
      const neededActive = quantity - acceptedCount
      const currentActive = pendingCount
      const toSend = neededActive - currentActive
      console.log(`Parallel strategy calculation:
  - Quantity: ${quantity}
  - Accepted: ${acceptedCount}
  - Pending: ${pendingCount}
  - Needed active (quantity - accepted): ${neededActive}
  - Current active (pending): ${currentActive}
  - To send (needed - current): ${toSend}`)
      if (toSend > 0) {
        musiciansToSend = availableMusicians.slice(0, toSend)
        console.log(`Will send to ${musiciansToSend.length} musicians`)
      }
      break

    case 'first_come':
      // Send to maxRecipients musicians at once
      console.log(`First come strategy:
  - Pending count: ${pendingCount}
  - Max recipients: ${maxRecipients}
  - Quantity: ${quantity}
  - Available musicians: ${availableMusicians.length}`)
      if (pendingCount === 0) {
        // Use maxRecipients if specified, otherwise send to ALL available musicians
        const recipientCount = maxRecipients || availableMusicians.length
        musiciansToSend = availableMusicians.slice(0, recipientCount)
        console.log(`Will send to ${musiciansToSend.length} musicians (max recipients: ${maxRecipients || 'ALL'})`)
      }
      break
  }

  // Send requests
  console.log(`
=== SENDING REQUESTS ===
Need ID: ${projectNeedId}
Musicians to send to: ${musiciansToSend.length}
Musician IDs: ${musiciansToSend.map(m => m.id).join(', ')}
========================`)
  
  let successCount = 0
  let failCount = 0
  
  // Use Promise.allSettled to send all requests in parallel
  const results = await Promise.allSettled(
    musiciansToSend.map(musician => createAndSendRequest(projectNeedId, musician.id))
  )
  
  // Count successes and failures
  results.forEach((result, index) => {
    const musician = musiciansToSend[index]
    if (result.status === 'fulfilled' && result.value === true) {
      successCount++
      console.log(`✅ Successfully queued request for musician ${musician.id}`)
    } else {
      failCount++
      console.log(`❌ Failed to queue request for musician ${musician.id}`)
    }
  })
  
  console.log(`
=== FINAL RESULT ===
Requests sent: ${successCount} successful, ${failCount} failed
Total attempted: ${musiciansToSend.length}
====================`)
}

async function getAvailableMusicians(
  projectNeedId: number,
  positionId: number,
  rankingListId?: number
) {
  if (rankingListId) {
    // Get musicians from ranking list in order
    const rankings = await prisma.ranking.findMany({
      where: {
        listId: rankingListId,
        musician: {
          isActive: true,
          qualifications: {
            some: {
              positionId
            }
          }
        }
      },
      include: {
        musician: true
      },
      orderBy: {
        rank: 'asc'
      }
    })

    const musicianIds = rankings.map(r => r.musicianId)
    const musicians = await prisma.musician.findMany({
      where: { id: { in: musicianIds } }
    })
    
    // Sort musicians by their ranking order
    const musicianMap = new Map(musicians.map(m => [m.id, m]))
    return musicianIds.map(id => musicianMap.get(id)).filter(Boolean) as any[]
  } else {
    // Get all qualified musicians
    const musicians = await prisma.musician.findMany({
      where: {
        isActive: true,
        qualifications: {
          some: {
            positionId
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    return musicians
  }
}

async function createAndSendRequest(projectNeedId: number, musicianId: number): Promise<boolean> {
  console.log('\n=== CREATE AND SEND REQUEST ===')
  console.log('Project Need ID:', projectNeedId)
  console.log('Musician ID:', musicianId)
  
  try {
    const requestId = await generateUniqueId('request')
    console.log(`Generated request ID: ${requestId}`)

    // Create request
    const request = await prisma.request.create({
      data: {
        requestId,
        projectNeedId,
        musicianId,
        status: 'pending',
        sentAt: new Date()
      },
      include: {
        projectNeed: true
      }
    })
    console.log(`Created request in database with ID: ${request.id}`)

    // Generate token
    const token = await generateRequestToken(request.id, request.projectNeed.responseTimeHours)
    console.log(`Generated token for request`)

    // Send email
    console.log('Sending request email...')
    await sendRequestEmail(request, token)
    console.log('Email sent successfully')

    console.log(`✅ Request successfully created and sent`)
    console.log('=== CREATE AND SEND REQUEST - END ===\n')
    return true
  } catch (error) {
    console.error(`❌ Failed to send request to musician ${musicianId}:`)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('=== CREATE AND SEND REQUEST - END (WITH ERROR) ===\n')
    return false
  }
}

export async function handleDeclinedRequest(requestId: number) {
  console.log('\n=== HANDLE DECLINED REQUEST - START ===')
  console.log('Request ID:', requestId)
  
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      projectNeed: true
    }
  })

  if (!request) {
    console.error('Request not found with ID:', requestId)
    throw new Error('Request not found')
  }

  const { projectNeed } = request
  
  console.log('Request details:')
  console.log('- Project Need ID:', projectNeed.id)
  console.log('- Strategy:', projectNeed.requestStrategy)
  console.log('- Quantity:', projectNeed.quantity)
  console.log('- Max Recipients:', projectNeed.maxRecipients)
  console.log('- Ranking List ID:', projectNeed.rankingListId)
  console.log('- Current status:', projectNeed.status)

  // Check current state before sending new requests
  const currentRequests = await prisma.request.findMany({
    where: { projectNeedId: projectNeed.id }
  })
  
  const acceptedCount = currentRequests.filter(r => r.status === 'accepted').length
  const pendingCount = currentRequests.filter(r => r.status === 'pending').length
  const declinedCount = currentRequests.filter(r => r.status === 'declined').length
  
  console.log('Current request state:')
  console.log('- Total requests:', currentRequests.length)
  console.log('- Accepted:', acceptedCount)
  console.log('- Pending:', pendingCount)
  console.log('- Declined:', declinedCount)
  
  if (projectNeed.status === 'completed') {
    console.log('⚠️ Need is already completed, skipping new request')
    return
  }
  
  if (acceptedCount >= projectNeed.quantity) {
    console.log('⚠️ Already have enough accepted musicians, skipping new request')
    return
  }

  // Check if there are available musicians BEFORE calling sendRequests
  console.log('Checking for available musicians before sending requests...')
  const existingRequests = await prisma.request.findMany({
    where: { projectNeedId: projectNeed.id }
  })
  const existingMusicianIds = existingRequests.map(r => r.musicianId)
  console.log('Musicians who already received requests:', existingMusicianIds)
  
  // Get available musicians using same logic as sendRequests
  let availableMusicians = []
  if (projectNeed.rankingListId) {
    console.log('Using ranking list:', projectNeed.rankingListId)
    const rankings = await prisma.ranking.findMany({
      where: {
        listId: projectNeed.rankingListId,
        musician: {
          isActive: true,
          qualifications: {
            some: {
              positionId: projectNeed.positionId
            }
          }
        }
      },
      include: { musician: true },
      orderBy: { rank: 'asc' }
    })
    
    availableMusicians = rankings
      .map(r => r.musician)
      .filter(m => !existingMusicianIds.includes(m.id))
  } else {
    console.log('No ranking list, using all qualified musicians')
    availableMusicians = await prisma.musician.findMany({
      where: {
        isActive: true,
        qualifications: {
          some: { positionId: projectNeed.positionId }
        },
        NOT: { id: { in: existingMusicianIds } }
      }
    })
  }
  
  console.log(`Found ${availableMusicians.length} available musicians:`)
  availableMusicians.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} (ID: ${m.id})`)
  })
  
  if (availableMusicians.length === 0) {
    console.log('⚠️ No available musicians found, cannot send replacement request')
    return
  }

  // Send new request based on strategy
  console.log('Calling sendRequests to find replacement...')
  try {
    await sendRequests({
      projectNeedId: projectNeed.id,
      strategy: projectNeed.requestStrategy as 'sequential' | 'parallel' | 'first_come',
      quantity: projectNeed.quantity,
      maxRecipients: projectNeed.maxRecipients || undefined,
      rankingListId: projectNeed.rankingListId || undefined
    })
    console.log('✅ Successfully sent replacement request(s)')
  } catch (error) {
    console.error('❌ Failed to send replacement requests:', error)
    console.error('Error details:', error)
    throw error
  }
  
  console.log('=== HANDLE DECLINED REQUEST - END ===\n')
}

export async function sendReminders() {
  // Get reminder percentage from settings
  const reminderSetting = await prisma.settings.findUnique({
    where: { key: 'reminder_percentage' }
  })
  const reminderPercentage = reminderSetting ? parseInt(reminderSetting.value) : 75

  // Get all pending requests with project need info
  const pendingRequests = await prisma.request.findMany({
    where: {
      status: 'pending',
      reminderSentAt: null
    },
    include: {
      projectNeed: true
    }
  })

  let remindersSent = 0

  for (const request of pendingRequests) {
    const hoursSinceSent = (Date.now() - request.sentAt.getTime()) / (1000 * 60 * 60)
    const reminderThreshold = request.projectNeed.responseTimeHours * (reminderPercentage / 100)
    
    if (hoursSinceSent >= reminderThreshold) {
      try {
        const { getOrCreateTokenForRequest } = await import('@/lib/request-tokens')
        const token = await getOrCreateTokenForRequest(request.id)
        const { sendReminderEmail } = await import('@/lib/email')
        await sendReminderEmail(request, token)
        remindersSent++
      } catch (error) {
        console.error(`Failed to send reminder for request ${request.id}:`, error)
      }
    }
  }

  return remindersSent
}

export async function handleTimeouts() {
  // Get all pending requests with project need info
  const pendingRequests = await prisma.request.findMany({
    where: {
      status: 'pending'
    },
    include: {
      projectNeed: true
    }
  })

  let timeoutsHandled = 0

  for (const request of pendingRequests) {
    const hoursSinceSent = (Date.now() - request.sentAt.getTime()) / (1000 * 60 * 60)
    
    // Check if request has exceeded its response time
    if (hoursSinceSent >= request.projectNeed.responseTimeHours) {
      try {
        // Mark as timed out
        await prisma.request.update({
          where: { id: request.id },
          data: { status: 'timed_out' }
        })

        // Handle based on strategy
        await handleDeclinedRequest(request.id)
        timeoutsHandled++
      } catch (error) {
        console.error(`Failed to handle timeout for request ${request.id}:`, error)
      }
    }
  }

  return timeoutsHandled
}