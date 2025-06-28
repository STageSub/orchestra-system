import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface TemplateVariables {
  firstName: string
  projectName: string
  instrument: string
  position: string
  startDate: string
  weekNumber?: string
  rehearsalSchedule?: string
  concertInfo?: string
  responseTime?: string
  yesLink: string
  noLink: string
  additionalInfo?: string
  attachmentNote?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('📧 EMAIL WOULD BE SENT:')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('HTML:', options.html.substring(0, 200) + '...')
    console.log('---')
    return true
  }

  try {
    // Create transporter with SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Orchestra System" <noreply@orchestra.se>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    })

    console.log('Email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function getEmailTemplate(type: string): Promise<{ subject: string; body: string } | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { type }
    })
    
    if (!template) {
      console.error(`Email template not found: ${type}`)
      return null
    }

    return {
      subject: template.subject,
      body: template.body
    }
  } catch (error) {
    console.error('Error fetching email template:', error)
    return null
  }
}

export function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  })

  // Format dates in Swedish
  result = result.replace(/{{startDate}}/g, formatDate(variables.startDate))

  return result
}

export async function sendRequestEmail(
  musicianEmail: string,
  variables: TemplateVariables
): Promise<boolean> {
  const template = await getEmailTemplate('request')
  
  if (!template) {
    console.error('Could not find request template')
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables)
  const html = replaceTemplateVariables(template.body, variables)

  return sendEmail({
    to: musicianEmail,
    subject,
    html
  })
}

export async function sendReminderEmail(
  musicianEmail: string,
  variables: TemplateVariables
): Promise<boolean> {
  const template = await getEmailTemplate('reminder')
  
  if (!template) {
    console.error('Could not find reminder template')
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables)
  const html = replaceTemplateVariables(template.body, variables)

  return sendEmail({
    to: musicianEmail,
    subject,
    html
  })
}

export async function sendConfirmationEmail(
  musicianEmail: string,
  variables: TemplateVariables & { accepted: boolean }
): Promise<boolean> {
  const templateType = variables.accepted ? 'confirmation' : 'position_filled'
  const template = await getEmailTemplate(templateType)
  
  if (!template) {
    console.error(`Could not find ${templateType} template`)
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables)
  const html = replaceTemplateVariables(template.body, variables)

  return sendEmail({
    to: musicianEmail,
    subject,
    html
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}