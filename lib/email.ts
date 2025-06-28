import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    filename: string
    content: string
  }>
}

export async function sendEmail({ to, subject, html, from = 'Orchestra System <no-reply@stagesub.com>', attachments }: SendEmailParams) {
  // Check if we should send real emails
  const forceRealEmails = process.env.FORCE_REAL_EMAILS === 'true'
  const hasApiKey = !!process.env.RESEND_API_KEY
  const shouldSimulate = (process.env.NODE_ENV === 'development' && !forceRealEmails) || !hasApiKey
  
  console.log('=== EMAIL DEBUG ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('FORCE_REAL_EMAILS:', process.env.FORCE_REAL_EMAILS)
  console.log('Has API Key:', hasApiKey)
  console.log('Should Simulate:', shouldSimulate)
  console.log('==================')
  
  // In development/test mode, just log the email (unless forced)
  if (shouldSimulate) {
    console.log('=== EMAIL SIMULATION ===')
    console.log('To:', to)
    console.log('From:', from)
    console.log('Subject:', subject)
    console.log('Body:', html)
    if (attachments && attachments.length > 0) {
      console.log('Attachments:', attachments.map(a => a.filename).join(', '))
    }
    console.log('========================')
    return { id: 'simulated-' + Date.now() }
  }

  console.log('=== SENDING REAL EMAIL ===')
  console.log('From:', from)
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('=========================')

  try {
    const emailData: any = {
      from,
      to,
      subject,
      html,
    }
    
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments
      console.log(`Including ${attachments.length} attachment(s)`)
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

interface TemplateVariables {
  firstName?: string
  lastName?: string
  projectName?: string
  positionName?: string
  instrumentName?: string
  startDate?: string
  weekNumber?: number
  rehearsalSchedule?: string
  concertInfo?: string
  responseUrl?: string
  quantity?: number
  attachmentNote?: string
  // Legacy format support (underscore versions)
  musician_name?: string
  project_name?: string
  instrument_name?: string
  start_date?: string
  rehearsal_schedule?: string
  concert_info?: string
  response_url?: string
  response_time?: number
  responseTime?: number
  [key: string]: string | number | null | undefined
}

export async function sendTemplatedEmail(
  type: string,
  to: string,
  variables: TemplateVariables,
  attachments?: Array<{ filename: string; content: string }>
) {
  console.log('\n=== SEND TEMPLATED EMAIL ===')
  console.log('Template type:', type)
  console.log('Recipient:', to)
  console.log('Variables provided:', Object.keys(variables).join(', '))
  
  const template = await prisma.emailTemplate.findUnique({
    where: { type }
  })

  if (!template) {
    console.error('Template not found:', type)
    throw new Error(`Email template '${type}' not found`)
  }
  
  console.log('Template found:', template.name)

  // Replace variables in template
  let subject = template.subject
  let body = template.body

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, String(value))
    body = body.replace(regex, String(value))
  })

  // Convert markdown links to HTML and newlines to paragraphs
  const html = body
    .split('\n')
    .map(line => {
      // Convert markdown links [text](url) to HTML <a> tags
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      const processedLine = line.replace(linkRegex, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
      return `<p style="margin: 8px 0;">${processedLine}</p>`
    })
    .join('')

  // Wrap in a nice email template
  const fullHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${html}
    </div>
  `

  console.log('Final subject:', subject)
  console.log('Calling sendEmail...')
  const result = await sendEmail({
    to,
    subject,
    html: fullHtml,
    attachments
  })
  console.log('=== SEND TEMPLATED EMAIL - END ===\n')
  return result
}

interface RequestWithRelations {
  id: number
  musicianId: number
  projectNeedId: number
}

async function getProjectFilesForEmail(
  projectId: number,
  projectNeedId: number | null,
  sendTiming: string
): Promise<Array<{ filename: string; content: string }>> {
  console.log(`Fetching files for project ${projectId}, need ${projectNeedId}, timing ${sendTiming}`)
  
  try {
    // Fetch files from database
    const files = await prisma.projectFile.findMany({
      where: {
        projectId,
        sendTiming,
        OR: [
          { projectNeedId: projectNeedId },
          { projectNeedId: null } // Include general project files
        ]
      }
    })
    
    console.log(`Found ${files.length} files to attach`)
    
    // Read files and convert to base64
    const attachments: Array<{ filename: string; content: string }> = []
    
    for (const file of files) {
      try {
        const filePath = path.join(process.cwd(), 'public', file.fileUrl)
        const fileBuffer = await readFile(filePath)
        const base64Content = fileBuffer.toString('base64')
        
        attachments.push({
          filename: file.fileName,
          content: base64Content
        })
        
        console.log(`Prepared attachment: ${file.fileName}`)
      } catch (error) {
        console.error(`Failed to read file ${file.fileName}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    return attachments
  } catch (error) {
    console.error('Error fetching project files:', error)
    return []
  }
}

export async function sendRequestEmail(
  request: RequestWithRelations,
  token: string
) {
  console.log('\n=== SEND REQUEST EMAIL - START ===')
  console.log('Request ID:', request.id)
  console.log('Token:', token.substring(0, 20) + '...')
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const responseUrl = `${appUrl}/respond?token=${token}`
  console.log('Response URL:', responseUrl)
  
  const musician = await prisma.musician.findUnique({
    where: { id: request.musicianId },
    include: {
      qualifications: {
        include: {
          position: {
            include: {
              instrument: true
            }
          }
        }
      }
    }
  })

  const projectNeed = await prisma.projectNeed.findUnique({
    where: { id: request.projectNeedId },
    include: {
      project: true,
      position: {
        include: {
          instrument: true
        }
      }
    }
  })

  if (!musician || !projectNeed) {
    throw new Error('Missing data for email')
  }

  const variables: TemplateVariables = {
    musician_name: `${musician.firstName} ${musician.lastName}`,
    firstName: musician.firstName,
    lastName: musician.lastName,
    project_name: projectNeed.project.name,
    projectName: projectNeed.project.name,
    position: projectNeed.position.name,
    positionName: projectNeed.position.name,
    instrument_name: projectNeed.position.instrument.name,
    instrumentName: projectNeed.position.instrument.name,
    start_date: new Date(projectNeed.project.startDate).toLocaleDateString('sv-SE'),
    startDate: new Date(projectNeed.project.startDate).toLocaleDateString('sv-SE'),
    weekNumber: projectNeed.project.weekNumber,
    rehearsal_schedule: projectNeed.project.rehearsalSchedule || 'Se bifogad information',
    rehearsalSchedule: projectNeed.project.rehearsalSchedule || 'Se bifogad information',
    concert_info: projectNeed.project.concertInfo || 'Se bifogad information',
    concertInfo: projectNeed.project.concertInfo || 'Se bifogad information',
    response_url: responseUrl,
    responseUrl,
    response_time: projectNeed.responseTimeHours,
    responseTime: projectNeed.responseTimeHours,
    quantity: projectNeed.quantity,
    responseUrl
  }

  console.log('Sending request email to:', musician.email)
  
  // Get files to attach with the request
  const attachments = await getProjectFilesForEmail(
    projectNeed.project.id,
    projectNeed.id,
    'on_request'
  )
  
  await sendTemplatedEmail('request', musician.email, variables, attachments)
  console.log('✅ Request email sent successfully')

  // Log the communication
  await prisma.communicationLog.create({
    data: {
      requestId: request.id,
      type: 'request_sent',
      timestamp: new Date()
    }
  })
  console.log('=== SEND REQUEST EMAIL - END ===\n')
}

export async function sendReminderEmail(request: RequestWithRelations, token: string) {
  const musician = await prisma.musician.findUnique({
    where: { id: request.musicianId }
  })

  const projectNeed = await prisma.projectNeed.findUnique({
    where: { id: request.projectNeedId },
    include: {
      project: true,
      position: {
        include: {
          instrument: true
        }
      }
    }
  })

  if (!musician || !projectNeed) {
    throw new Error('Missing data for reminder email')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const responseUrl = `${appUrl}/respond?token=${token}`

  const variables: TemplateVariables = {
    musician_name: `${musician.firstName} ${musician.lastName}`,
    firstName: musician.firstName,
    lastName: musician.lastName,
    project_name: projectNeed.project.name,
    projectName: projectNeed.project.name,
    position: projectNeed.position.name,
    positionName: projectNeed.position.name,
    response_url: responseUrl,
    responseUrl
  }

  await sendTemplatedEmail('reminder', musician.email, variables)

  // Update reminder sent timestamp
  await prisma.request.update({
    where: { id: request.id },
    data: { reminderSentAt: new Date() }
  })

  // Log the communication
  await prisma.communicationLog.create({
    data: {
      requestId: request.id,
      type: 'reminder_sent',
      timestamp: new Date()
    }
  })
}

export async function sendConfirmationEmail(request: RequestWithRelations) {
  console.log('\n=== SEND CONFIRMATION EMAIL - START ===')
  console.log('Called with request:', {
    id: request.id,
    musicianId: request.musicianId,
    projectNeedId: request.projectNeedId
  })
  console.log('Caller stack trace:', new Error().stack?.split('\n').slice(2, 5).join('\n'))
  
  try {
    console.log('Fetching musician data...')
    const musician = await prisma.musician.findUnique({
      where: { id: request.musicianId }
    })
    console.log('Musician found:', musician ? `${musician.firstName} ${musician.lastName} (${musician.email})` : 'NOT FOUND')

    console.log('Fetching project need data...')
    const projectNeed = await prisma.projectNeed.findUnique({
      where: { id: request.projectNeedId },
      include: {
        project: true,
        position: {
          include: {
            instrument: true
          }
        }
      }
    })
    console.log('Project need found:', projectNeed ? projectNeed.project.name : 'NOT FOUND')

    if (!musician || !projectNeed) {
      console.error('Missing data for confirmation email:', { musicianId: request.musicianId, projectNeedId: request.projectNeedId })
      throw new Error('Missing data for confirmation email')
    }

  // Get files to attach with the confirmation
  const attachments = await getProjectFilesForEmail(
    projectNeed.project.id,
    projectNeed.id,
    'on_accept'
  )
  
  const variables: TemplateVariables = {
    musician_name: `${musician.firstName} ${musician.lastName}`,
    firstName: musician.firstName,
    lastName: musician.lastName,
    project_name: projectNeed.project.name,
    projectName: projectNeed.project.name,
    position: projectNeed.position.name,
    positionName: projectNeed.position.name,
    instrument_name: projectNeed.position.instrument.name,
    instrumentName: projectNeed.position.instrument.name,
    start_date: new Date(projectNeed.project.startDate).toLocaleDateString('sv-SE'),
    startDate: new Date(projectNeed.project.startDate).toLocaleDateString('sv-SE'),
    weekNumber: projectNeed.project.weekNumber,
    rehearsal_schedule: projectNeed.project.rehearsalSchedule || 'Information kommer senare',
    rehearsalSchedule: projectNeed.project.rehearsalSchedule || 'Information kommer senare',
    concert_info: projectNeed.project.concertInfo || 'Information kommer senare',
    concertInfo: projectNeed.project.concertInfo || 'Information kommer senare',
    attachmentNote: attachments.length > 0 
      ? 'Se bifogade filer för noter och ytterligare information.' 
      : 'Noter och annan information kommer att skickas separat.'
  }

  console.log('Sending confirmation email with variables:', variables)
  await sendTemplatedEmail('confirmation', musician.email, variables, attachments)
  console.log('✅ Confirmation email sent successfully')

  // Update confirmation sent flag
  console.log('Updating confirmation sent flag...')
  await prisma.request.update({
    where: { id: request.id },
    data: { confirmationSent: true }
  })
  console.log('Confirmation flag updated')

  // Log the communication
  console.log('Creating communication log...')
  await prisma.communicationLog.create({
    data: {
      requestId: request.id,
      type: 'confirmation_sent',
      timestamp: new Date()
    }
  })
  console.log('Communication log created')
  console.log('=== SEND CONFIRMATION EMAIL - END ===\n')
  } catch (error) {
    console.error('❌ Error in sendConfirmationEmail:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('=== SEND CONFIRMATION EMAIL - END (WITH ERROR) ===\n')
    throw error
  }
}

export async function sendPositionFilledEmail(request: RequestWithRelations) {
  const musician = await prisma.musician.findUnique({
    where: { id: request.musicianId }
  })

  const projectNeed = await prisma.projectNeed.findUnique({
    where: { id: request.projectNeedId },
    include: {
      project: true,
      position: {
        include: {
          instrument: true
        }
      }
    }
  })

  if (!musician || !projectNeed) {
    throw new Error('Missing data for position filled email')
  }

  const variables: TemplateVariables = {
    musician_name: `${musician.firstName} ${musician.lastName}`,
    firstName: musician.firstName,
    lastName: musician.lastName,
    project_name: projectNeed.project.name,
    projectName: projectNeed.project.name,
    position: projectNeed.position.name,
    positionName: projectNeed.position.name
  }

  await sendTemplatedEmail('position_filled', musician.email, variables)

  // Log the communication
  await prisma.communicationLog.create({
    data: {
      requestId: request.id,
      type: 'position_filled_sent',
      timestamp: new Date()
    }
  })
}