import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getFile } from '@/lib/file-handler-db'
import { getLogStorage } from '@/lib/log-storage'

// Initialize log storage for email module
if (process.env.NODE_ENV === 'development') {
  getLogStorage()
}

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
  attachments?: Array<{ filename: string; content: string }>,
  language: 'sv' | 'en' = 'sv'
) {
  console.error('\n=== SEND TEMPLATED EMAIL ===')
  console.error('Template type:', type)
  console.error('Language parameter:', language)
  console.error('Language type:', typeof language)
  console.error('Recipient:', to)
  console.error('Variables provided:', Object.keys(variables).join(', '))
  
  // Select template based on language
  const templateType = language === 'en' ? `${type}_en` : type
  console.error('Language check: language === "en"?', language === 'en')
  console.error('Looking for template:', templateType)
  
  const template = await prisma.emailTemplate.findUnique({
    where: { type: templateType }
  })

  if (!template) {
    console.error('Template not found:', templateType)
    console.log('Falling back to Swedish template:', type)
    // Fallback to Swedish template if English not found
    const fallbackTemplate = await prisma.emailTemplate.findUnique({
      where: { type: type }
    })
    if (fallbackTemplate) {
      console.log('Using fallback Swedish template')
      return sendTemplatedEmail(type, to, variables, attachments, 'sv')
    }
    throw new Error(`Email template '${templateType}' not found`)
  }
  
  console.log('Template found:', templateType, '- Subject:', template.subject)

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
  musician?: {
    id: number
    firstName: string
    lastName: string
    email: string
    preferredLanguage?: string | null
  }
  projectNeed?: {
    id: number
    project: {
      id: number
      name: string
      startDate: Date
      weekNumber: number
      rehearsalSchedule?: string | null
      concertInfo?: string | null
    }
    position: {
      id: number
      name: string
      instrument: {
        id: number
        name: string
      }
    }
  }
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
        // Check if this is a new database-stored file
        if (file.fileUrl.startsWith('/api/files/')) {
          const fileId = file.fileUrl.replace('/api/files/', '')
          const storedFile = await getFile(fileId)
          
          if (storedFile) {
            attachments.push({
              filename: file.originalFileName || file.fileName,
              content: storedFile.content.toString('base64')
            })
            console.log(`Prepared attachment from DB: ${file.originalFileName || file.fileName}`)
          }
        } else {
          // Legacy: Try to fetch from API endpoint for backward compatibility
          console.log(`Attempting to fetch legacy file: ${file.fileUrl}`)
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(`${baseUrl}${file.fileUrl}`)
          
          if (response.ok) {
            const buffer = await response.arrayBuffer()
            const base64Content = Buffer.from(buffer).toString('base64')
            
            attachments.push({
              filename: file.originalFileName || file.fileName,
              content: base64Content
            })
            
            console.log(`Prepared attachment via HTTP: ${file.originalFileName || file.fileName}`)
          } else {
            console.error(`Failed to fetch file ${file.fileName} via HTTP:`, response.status)
          }
        }
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
  
  // Check if we're in test mode with mocked email
  if (global.sendRequestEmail && process.env.NODE_ENV === 'test') {
    console.log('Using mocked email function')
    return global.sendRequestEmail(request, token)
  }
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

  const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'

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
    start_date: new Date(projectNeed.project.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'sv-SE'),
    startDate: new Date(projectNeed.project.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'sv-SE'),
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
  
  await sendTemplatedEmail('request', musician.email, variables, attachments, language)
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
  // Check if we're in test mode with mocked email
  if (global.sendReminderEmail && process.env.NODE_ENV === 'test') {
    return global.sendReminderEmail(request, token)
  }
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

  const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'
  await sendTemplatedEmail('reminder', musician.email, variables, undefined, language)

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
  // Force log storage initialization
  const logStorage = getLogStorage()
  
  console.error('\n\n🔴🔴🔴 SEND CONFIRMATION EMAIL - START 🔴🔴🔴')
  console.error('Log storage active:', !!logStorage)
  console.error('Called with request:', {
    id: request.id,
    musicianId: request.musicianId,
    projectNeedId: request.projectNeedId
  })
  console.error('Caller stack trace:', new Error().stack?.split('\n').slice(2, 5).join('\n'))
  
  // Check if we're in test mode with mocked email
  if (global.sendConfirmationEmail && process.env.NODE_ENV === 'test') {
    console.log('Using mocked confirmation email function')
    return global.sendConfirmationEmail(request)
  }
  
  try {
    // First try to use data from the request object if available
    let musician = request.musician
    let projectNeed = request.projectNeed
    
    // If data is not included, fetch from database
    if (!musician) {
      console.log('Musician not in request, fetching from database...')
      musician = await prisma.musician.findUnique({
        where: { id: request.musicianId }
      })
    }
    console.log('Musician:', musician ? `${musician.firstName} ${musician.lastName} (${musician.email}) - Language: ${musician.preferredLanguage}` : 'NOT FOUND')

    if (!projectNeed) {
      console.log('Project need not in request, fetching from database...')
      projectNeed = await prisma.projectNeed.findUnique({
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
    }
    console.log('Project need:', projectNeed ? projectNeed.project.name : 'NOT FOUND')

    if (!musician || !projectNeed) {
      console.error('Missing data for confirmation email:', { musicianId: request.musicianId, projectNeedId: request.projectNeedId })
      throw new Error('Missing data for confirmation email')
    }

  const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'
  console.error('=== LANGUAGE SELECTION DEBUG ===')
  console.error('Musician preferredLanguage:', musician.preferredLanguage)
  console.error('Type of preferredLanguage:', typeof musician.preferredLanguage)
  console.error('Selected language for email:', language)
  console.error('Language === "en"?', language === 'en')
  console.error('===============================')

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
    start_date: new Date(projectNeed.project.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'sv-SE'),
    startDate: new Date(projectNeed.project.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'sv-SE'),
    weekNumber: projectNeed.project.weekNumber,
    rehearsal_schedule: projectNeed.project.rehearsalSchedule || 'Information kommer senare',
    rehearsalSchedule: projectNeed.project.rehearsalSchedule || 'Information kommer senare',
    concert_info: projectNeed.project.concertInfo || 'Information kommer senare',
    concertInfo: projectNeed.project.concertInfo || 'Information kommer senare',
    attachmentNote: attachments.length > 0 
      ? language === 'en'
        ? 'See attached files for sheet music and additional information.'
        : 'Se bifogade filer för noter och ytterligare information.' 
      : language === 'en' 
        ? 'Sheet music and other information will be sent separately.'
        : 'Noter och annan information kommer att skickas separat.'
  }

  console.error('Sending confirmation email with variables:', variables)
  console.error('About to call sendTemplatedEmail with:')
  console.error('- type: confirmation')
  console.error('- to:', musician.email)
  console.error('- attachments:', attachments.length)
  console.error('- language:', language)
  await sendTemplatedEmail('confirmation', musician.email, variables, attachments, language)
  console.error('✅ Confirmation email sent successfully')

  // Update confirmation sent flag (skip for test requests)
  if (request.id !== 999) {
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
  } else {
    console.log('Skipping database updates for test request (ID 999)')
  }
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
  // Check if we're in test mode with mocked email
  if (global.sendPositionFilledEmail && process.env.NODE_ENV === 'test') {
    return global.sendPositionFilledEmail(request)
  }
  // First try to use data from the request object if available
  let musician = request.musician
  let projectNeed = request.projectNeed
  
  // If data is not included, fetch from database
  if (!musician) {
    musician = await prisma.musician.findUnique({
      where: { id: request.musicianId }
    })
  }

  if (!projectNeed) {
    projectNeed = await prisma.projectNeed.findUnique({
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
  }

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

  const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'
  await sendTemplatedEmail('position_filled', musician.email, variables, undefined, language)

  // Log the communication
  await prisma.communicationLog.create({
    data: {
      requestId: request.id,
      type: 'position_filled_sent',
      timestamp: new Date()
    }
  })
}