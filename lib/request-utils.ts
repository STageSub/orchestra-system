import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { sendRequestEmail, sendReminderEmail } from '@/lib/email-service'

export interface CreateRequestParams {
  projectNeedId: number
  musicianId: number
}

export async function createRequest({ projectNeedId, musicianId }: CreateRequestParams) {
  const requestId = await generateUniqueId('request')
  
  const request = await prisma.request.create({
    data: {
      requestId,
      projectNeedId,
      musicianId,
      status: 'pending'
    },
    include: {
      musician: true,
      projectNeed: {
        include: {
          project: true,
          position: {
            include: {
              instrument: true
            }
          }
        }
      }
    }
  })

  const responseTimeHours = request.projectNeed.responseTimeHours || 24
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + responseTimeHours)

  const token = await prisma.requestToken.create({
    data: {
      requestId: request.id,
      expiresAt
    }
  })

  const responseUrls = {
    yes: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/respond?token=${token.token}&answer=yes`,
    no: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/respond?token=${token.token}&answer=no`
  }

  // Send email
  const emailSent = await sendRequestEmail(request.musician.email, {
    firstName: request.musician.firstName,
    projectName: request.projectNeed.project.name,
    instrument: request.projectNeed.position.instrument.name,
    position: request.projectNeed.position.name,
    startDate: request.projectNeed.project.startDate.toISOString(),
    weekNumber: request.projectNeed.project.weekNumber.toString(),
    rehearsalSchedule: request.projectNeed.project.rehearsalSchedule || undefined,
    concertInfo: request.projectNeed.project.concertInfo || undefined,
    responseTime: `${responseTimeHours} timmar`,
    yesLink: responseUrls.yes,
    noLink: responseUrls.no,
    additionalInfo: request.projectNeed.project.notes || undefined
  })

  const communicationLogId = await generateUniqueId('communicationLog')
  await prisma.communicationLog.create({
    data: {
      communicationLogId,
      requestId: request.id,
      type: 'request_sent',
      emailContent: emailSent ? 'Initial request email sent successfully' : 'Failed to send initial request email'
    }
  })

  return {
    request,
    token,
    responseUrls,
    emailSent
  }
}

export async function sendReminder(requestId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      musician: true,
      projectNeed: {
        include: {
          project: true,
          position: {
            include: {
              instrument: true
            }
          }
        }
      },
      requestTokens: {
        where: {
          usedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  })

  if (!request || request.status !== 'pending' || request.requestTokens.length === 0) {
    throw new Error('Invalid request for reminder')
  }

  const token = request.requestTokens[0]
  
  const responseUrls = {
    yes: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/respond?token=${token.token}&answer=yes`,
    no: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/respond?token=${token.token}&answer=no`
  }

  // Send reminder email
  const emailSent = await sendReminderEmail(request.musician.email, {
    firstName: request.musician.firstName,
    projectName: request.projectNeed.project.name,
    instrument: request.projectNeed.position.instrument.name,
    position: request.projectNeed.position.name,
    startDate: request.projectNeed.project.startDate.toISOString(),
    weekNumber: request.projectNeed.project.weekNumber.toString(),
    rehearsalSchedule: request.projectNeed.project.rehearsalSchedule || undefined,
    concertInfo: request.projectNeed.project.concertInfo || undefined,
    yesLink: responseUrls.yes,
    noLink: responseUrls.no,
    additionalInfo: request.projectNeed.project.notes || undefined
  })

  await prisma.request.update({
    where: { id: requestId },
    data: { reminderSentAt: new Date() }
  })

  const communicationLogId = await generateUniqueId('communicationLog')
  await prisma.communicationLog.create({
    data: {
      communicationLogId,
      requestId: request.id,
      type: 'reminder_sent',
      emailContent: emailSent ? 'Reminder email sent successfully' : 'Failed to send reminder email'
    }
  })

  return {
    request,
    responseUrls,
    emailSent
  }
}

export async function checkRequestStatus(projectNeedId: number) {
  const projectNeed = await prisma.projectNeed.findUnique({
    where: { id: projectNeedId },
    include: {
      requests: true
    }
  })

  if (!projectNeed) {
    throw new Error('Project need not found')
  }

  const acceptedCount = projectNeed.requests.filter(r => r.status === 'accepted').length
  const pendingCount = projectNeed.requests.filter(r => r.status === 'pending').length
  const declinedCount = projectNeed.requests.filter(r => r.status === 'declined').length

  const isFullyStaffed = acceptedCount >= projectNeed.quantity
  const needsMoreRequests = !isFullyStaffed && pendingCount === 0

  return {
    acceptedCount,
    pendingCount,
    declinedCount,
    totalNeeded: projectNeed.quantity,
    isFullyStaffed,
    needsMoreRequests,
    remainingNeeded: Math.max(0, projectNeed.quantity - acceptedCount)
  }
}