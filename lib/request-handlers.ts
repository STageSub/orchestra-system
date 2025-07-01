import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function handleDeclinedRequest(requestId: number) {
  console.log('\n=== HANDLE DECLINED REQUEST - START ===')
  console.log('Request ID:', requestId)
  
  const request = await prismaMultitenant.request.findUnique({
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
  const currentRequests = await prismaMultitenant.request.findMany({
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

  // Use the unified function to send replacement requests
  console.log('Checking for available musicians and sending replacement...')
  try {
    const { getRecipientsForNeed } = await import('@/lib/recipient-selection')
    const result = await getRecipientsForNeed(projectNeed.id, {
      dryRun: false,
      includeDetails: false
    })
    
    if (result.totalToSend > 0) {
      console.log(`✅ Successfully sent ${result.totalToSend} replacement request(s)`)
    } else {
      console.log('⚠️ No available musicians found, cannot send replacement request')
    }
  } catch (error) {
    console.error('❌ Failed to send replacement requests:', error)
    console.error('Error details:', error)
    throw error
  }
  
  console.log('=== HANDLE DECLINED REQUEST - END ===\n')
}

export async function sendReminders() {
  // Get reminder percentage from settings
  const reminderSetting = await prismaMultitenant.settings.findUnique({
    where: { key: 'reminder_percentage' }
  })
  const reminderPercentage = reminderSetting ? parseInt(reminderSetting.value) : 75

  // Get all pending requests with project need info
  const pendingRequests = await prismaMultitenant.request.findMany({
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
  const pendingRequests = await prismaMultitenant.request.findMany({
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
        await prismaMultitenant.request.update({
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