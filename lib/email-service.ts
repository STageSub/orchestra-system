import nodemailer from 'nodemailer'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

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

export async function getEmailTemplate(type: string, language: 'sv' | 'en' = 'sv'): Promise<{ subject: string; body: string } | null> {
  try {
    // Add language suffix for non-Swedish templates
    const templateType = language === 'en' ? `${type}_en` : type
    
    const template = await prismaMultitenant.emailTemplate.findUnique({
      where: { type: templateType }
    })
    
    if (!template) {
      console.error(`Email template not found: ${templateType}`)
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

export function replaceTemplateVariables(template: string, variables: TemplateVariables, language: 'sv' | 'en' = 'sv'): string {
  let result = template

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  })

  // Format dates according to language
  result = result.replace(/{{startDate}}/g, formatDate(variables.startDate, language))

  return result
}

export async function sendRequestEmail(
  musicianEmail: string,
  variables: TemplateVariables,
  language: 'sv' | 'en' = 'sv'
): Promise<boolean> {
  const template = await getEmailTemplate('request', language)
  
  if (!template) {
    console.error('Could not find request template')
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables, language)
  const html = replaceTemplateVariables(template.body, variables, language)

  return sendEmail({
    to: musicianEmail,
    subject,
    html
  })
}

export async function sendReminderEmail(
  musicianEmail: string,
  variables: TemplateVariables,
  language: 'sv' | 'en' = 'sv'
): Promise<boolean> {
  const template = await getEmailTemplate('reminder', language)
  
  if (!template) {
    console.error('Could not find reminder template')
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables, language)
  const html = replaceTemplateVariables(template.body, variables, language)

  return sendEmail({
    to: musicianEmail,
    subject,
    html
  })
}

export async function sendConfirmationEmail(
  musicianEmail: string,
  variables: TemplateVariables & { accepted: boolean },
  language: 'sv' | 'en' = 'sv'
): Promise<boolean> {
  const templateType = variables.accepted ? 'confirmation' : 'position_filled'
  const template = await getEmailTemplate(templateType, language)
  
  if (!template) {
    console.error(`Could not find ${templateType} template`)
    return false
  }

  const subject = replaceTemplateVariables(template.subject, variables, language)
  const html = replaceTemplateVariables(template.body, variables, language)

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

function formatDate(dateString: string, language: 'sv' | 'en' = 'sv'): string {
  const date = new Date(dateString)
  const locale = language === 'en' ? 'en-US' : 'sv-SE'
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}