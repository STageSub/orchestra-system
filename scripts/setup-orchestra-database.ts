#!/usr/bin/env ts-node

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function setupOrchestraDatabase(databaseUrl: string, orchestraName: string, subdomain: string) {
  console.log(`Setting up database for ${orchestraName}...`)
  
  try {
    // Run migrations
    console.log('Running migrations...')
    execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`, {
      stdio: 'inherit'
    })
    
    // Create a new Prisma client for this specific database
    const targetPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })
    
    // Seed initial data
    console.log('Seeding initial data...')
    
    // Create default email templates
    const emailTemplates = [
      {
        id: 'template-request-sv',
        type: 'request',
        name: 'Förfrågan',
        subject: 'Förfrågan om vikarietjänst - {{projectName}}',
        body: `Hej {{firstName}},

Vi söker en {{positionName}} för {{projectName}} med start {{startDate}}.

Vänligen svara inom {{responseTime}} timmar genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
${orchestraName}`,
        variables: ['firstName', 'projectName', 'positionName', 'startDate', 'responseTime', 'responseUrl']
      },
      {
        id: 'template-reminder-sv',
        type: 'reminder',
        name: 'Påminnelse',
        subject: 'Påminnelse: Förfrågan om vikarietjänst - {{projectName}}',
        body: `Hej {{firstName}},

Detta är en påminnelse om vår förfrågan gällande vikarietjänst som {{positionName}} för {{projectName}}.

Vänligen svara snarast genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
${orchestraName}`,
        variables: ['firstName', 'projectName', 'positionName', 'responseUrl']
      },
      {
        id: 'template-confirmation-sv',
        type: 'confirmation',
        name: 'Bekräftelse',
        subject: 'Bekräftelse: {{projectName}}',
        body: `Hej {{firstName}},

Tack för att du accepterat uppdraget som {{positionName}} för {{projectName}}.

Start: {{startDate}}

Vi återkommer med mer information.

Med vänliga hälsningar,
${orchestraName}`,
        variables: ['firstName', 'projectName', 'positionName', 'startDate']
      },
      {
        id: 'template-position-filled-sv',
        type: 'position_filled',
        name: 'Tjänst tillsatt',
        subject: 'Tjänsten är tillsatt - {{projectName}}',
        body: `Hej {{firstName}},

Tack för ditt intresse för tjänsten som {{positionName}} för {{projectName}}.

Tjänsten är nu tillsatt.

Med vänliga hälsningar,
${orchestraName}`,
        variables: ['firstName', 'projectName', 'positionName']
      }
    ]
    
    for (const template of emailTemplates) {
      await targetPrisma.emailTemplate.create({
        data: template
      })
    }
    
    // Create default system settings
    await targetPrisma.systemSettings.create({
      data: {
        id: 'settings-default',
        language: 'sv',
        timezone: 'Europe/Stockholm',
        emailFromName: orchestraName,
        emailFromAddress: 'no-reply@stagesub.com',
        defaultResponseTime: 48,
        allowConflicts: false,
        conflictStrategy: 'warn',
        enableNotifications: true,
        notificationEmail: null
      }
    })
    
    console.log('✅ Database setup completed successfully!')
    
    await targetPrisma.$disconnect()
  } catch (error) {
    console.error('❌ Failed to setup database:', error)
    throw error
  }
}

// Check if script is run directly
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.error('Usage: npm run setup-orchestra <database-url> <orchestra-name> <subdomain>')
    process.exit(1)
  }
  
  const [databaseUrl, orchestraName, subdomain] = args
  
  setupOrchestraDatabase(databaseUrl, orchestraName, subdomain)
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}

export { setupOrchestraDatabase }