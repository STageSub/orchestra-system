import { PrismaClient } from '@prisma/client'
import { PrismaClient as PrismaCentralClient } from '@prisma/client-central'
import { getSubdomainFromPrismaClient } from '@/lib/database-config'
import { logger } from '@/lib/logger'
import twilio from 'twilio'

// Cache for Twilio instances per orchestra
const twilioInstances: Record<string, any> = {}

// Get orchestra SMS configuration
async function getSmsConfig(subdomain: string | null) {
  if (!subdomain) {
    return null
  }
  
  try {
    const centralPrisma = new PrismaCentralClient({
      datasources: {
        db: {
          url: process.env.CENTRAL_DATABASE_URL
        }
      }
    })
    
    const orchestra = await centralPrisma.orchestra.findUnique({
      where: { subdomain },
      select: {
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioFromNumber: true,
        smsOnRequest: true,
        smsOnReminder: true,
        smsOnConfirmation: true,
        smsOnPositionFilled: true,
        smsOnGroupEmail: true
      }
    })
    
    return orchestra
  } catch (error) {
    console.error(`Failed to get SMS config for ${subdomain}:`, error)
    return null
  }
}

// Get Twilio client for orchestra
async function getTwilioClient(subdomain: string | null) {
  if (!subdomain) {
    return null
  }
  
  // Check cache
  if (twilioInstances[subdomain]) {
    return twilioInstances[subdomain]
  }
  
  const config = await getSmsConfig(subdomain)
  
  if (!config?.twilioAccountSid || !config?.twilioAuthToken) {
    return null
  }
  
  try {
    const client = twilio(config.twilioAccountSid, config.twilioAuthToken)
    twilioInstances[subdomain] = client
    return client
  } catch (error) {
    console.error(`Failed to create Twilio client for ${subdomain}:`, error)
    return null
  }
}

interface SendSmsParams {
  to: string
  body: string
  subdomain?: string | null
}

export async function sendSms({ to, body, subdomain }: SendSmsParams): Promise<boolean> {
  if (!subdomain) {
    console.log('No subdomain provided, SMS not sent')
    return false
  }
  
  const config = await getSmsConfig(subdomain)
  if (!config) {
    console.log('No SMS configuration found')
    return false
  }
  
  const client = await getTwilioClient(subdomain)
  if (!client || !config.twilioFromNumber) {
    console.log('Twilio not configured properly')
    return false
  }
  
  // Check if we should simulate in development
  const shouldSimulate = process.env.NODE_ENV === 'development' && process.env.FORCE_REAL_SMS !== 'true'
  
  if (shouldSimulate) {
    console.log('=== SMS SIMULATION ===')
    console.log('To:', to)
    console.log('From:', config.twilioFromNumber)
    console.log('Body:', body)
    console.log('Orchestra:', subdomain)
    console.log('=====================')
    
    await logger.info('sms', `SMS simulated to ${to}`, {
      metadata: {
        to,
        from: config.twilioFromNumber,
        body,
        subdomain,
        mode: 'simulation'
      }
    })
    
    return true
  }
  
  try {
    console.log('Sending SMS via Twilio...')
    const message = await client.messages.create({
      body,
      to,
      from: config.twilioFromNumber
    })
    
    console.log('SMS sent successfully:', message.sid)
    
    await logger.info('sms', `SMS sent to ${to}`, {
      metadata: {
        to,
        from: config.twilioFromNumber,
        body,
        subdomain,
        messageSid: message.sid
      }
    })
    
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    
    await logger.error('sms', `SMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        to,
        from: config.twilioFromNumber,
        body,
        subdomain,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return false
  }
}

// SMS template functions
export async function shouldSendSms(eventType: string, subdomain: string | null): Promise<boolean> {
  if (!subdomain) return false
  
  const config = await getSmsConfig(subdomain)
  if (!config) return false
  
  switch (eventType) {
    case 'request':
      return config.smsOnRequest || false
    case 'reminder':
      return config.smsOnReminder || false
    case 'confirmation':
      return config.smsOnConfirmation || false
    case 'position_filled':
      return config.smsOnPositionFilled || false
    case 'group_email':
      return config.smsOnGroupEmail || false
    default:
      return false
  }
}

export async function sendRequestSms(
  musicianPhone: string,
  musicianName: string,
  projectName: string,
  position: string,
  prisma: PrismaClient
): Promise<boolean> {
  const subdomain = getSubdomainFromPrismaClient(prisma)
  
  if (!await shouldSendSms('request', subdomain)) {
    return false
  }
  
  const body = `Hej ${musicianName}! Du har fått en förfrågan om att vikariera som ${position} i ${projectName}. Kolla din e-post för mer information.`
  
  return sendSms({
    to: musicianPhone,
    body,
    subdomain
  })
}

export async function sendReminderSms(
  musicianPhone: string,
  musicianName: string,
  projectName: string,
  prisma: PrismaClient
): Promise<boolean> {
  const subdomain = getSubdomainFromPrismaClient(prisma)
  
  if (!await shouldSendSms('reminder', subdomain)) {
    return false
  }
  
  const body = `Påminnelse: Du har en obesvarad förfrågan för ${projectName}. Vänligen svara snarast.`
  
  return sendSms({
    to: musicianPhone,
    body,
    subdomain
  })
}

export async function sendConfirmationSms(
  musicianPhone: string,
  musicianName: string,
  projectName: string,
  position: string,
  prisma: PrismaClient
): Promise<boolean> {
  const subdomain = getSubdomainFromPrismaClient(prisma)
  
  if (!await shouldSendSms('confirmation', subdomain)) {
    return false
  }
  
  const body = `Tack ${musicianName}! Du är nu bokad som ${position} för ${projectName}. Mer info kommer via e-post.`
  
  return sendSms({
    to: musicianPhone,
    body,
    subdomain
  })
}

export async function sendPositionFilledSms(
  musicianPhone: string,
  musicianName: string,
  projectName: string,
  position: string,
  prisma: PrismaClient
): Promise<boolean> {
  const subdomain = getSubdomainFromPrismaClient(prisma)
  
  if (!await shouldSendSms('position_filled', subdomain)) {
    return false
  }
  
  const body = `Hej ${musicianName}. Positionen som ${position} för ${projectName} är tyvärr redan tillsatt.`
  
  return sendSms({
    to: musicianPhone,
    body,
    subdomain
  })
}

export async function sendGroupSms(
  recipients: Array<{ phone: string; name: string }>,
  message: string,
  prisma: PrismaClient
): Promise<{ sent: number; failed: number }> {
  const subdomain = getSubdomainFromPrismaClient(prisma)
  
  if (!await shouldSendSms('group_email', subdomain)) {
    return { sent: 0, failed: 0 }
  }
  
  let sent = 0
  let failed = 0
  
  for (const recipient of recipients) {
    if (!recipient.phone) {
      failed++
      continue
    }
    
    const success = await sendSms({
      to: recipient.phone,
      body: message,
      subdomain
    })
    
    if (success) {
      sent++
    } else {
      failed++
    }
  }
  
  return { sent, failed }
}