const { PrismaClient } = require('@prisma/client')

async function seedScosoTemplates() {
  // SCOSO database URL with encoded special characters
  const databaseUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    console.log('Connecting to SCOSO database...')
    
    // Check if templates already exist
    const existingTemplates = await prisma.emailTemplate.count()
    console.log(`Found ${existingTemplates} existing templates`)
    
    if (existingTemplates > 0) {
      console.log('Templates already exist. Skipping seed.')
      return
    }
    
    // Default email templates
    const templates = [
      {
        type: 'request',
        subject: 'Förfrågan om vikariat - {{projectName}}',
        body: `Hej {{firstName}}!

Vi söker en {{position}} för {{projectName}} med start {{startDate}}.

{{#if rehearsalSchedule}}
Repetitionsschema:
{{rehearsalSchedule}}
{{/if}}

{{#if concertInfo}}
Konsertinformation:
{{concertInfo}}
{{/if}}

{{#if attachmentNote}}
{{attachmentNote}}
{{/if}}

Vänligen svara inom {{responseTime}}:

✅ JA, jag kan: {{yesLink}}
❌ NEJ, jag kan inte: {{noLink}}

Med vänliga hälsningar,
Orchestra System`,
        variables: ['firstName', 'projectName', 'position', 'instrument', 'startDate', 'weekNumber', 'rehearsalSchedule', 'concertInfo', 'responseTime', 'yesLink', 'noLink', 'attachmentNote']
      },
      {
        type: 'reminder',
        subject: 'Påminnelse: Förfrågan om vikariat - {{projectName}}',
        body: `Hej {{firstName}}!

Detta är en påminnelse om din förfrågan för {{projectName}}.

Vi behöver fortfarande en {{position}} med start {{startDate}}.

Vänligen svara så snart som möjligt:

✅ JA, jag kan: {{yesLink}}
❌ NEJ, jag kan inte: {{noLink}}

Med vänliga hälsningar,
Orchestra System`,
        variables: ['firstName', 'projectName', 'position', 'startDate', 'yesLink', 'noLink']
      },
      {
        type: 'confirmation',
        subject: 'Bekräftelse - {{projectName}}',
        body: `Hej {{firstName}}!

Tack för att du accepterat vikariatet som {{position}} för {{projectName}}.

Start: {{startDate}}

{{#if rehearsalSchedule}}
Repetitionsschema:
{{rehearsalSchedule}}
{{/if}}

{{#if concertInfo}}
Konsertinformation:
{{concertInfo}}
{{/if}}

{{#if attachmentNote}}
{{attachmentNote}}
{{/if}}

Vi ser fram emot att arbeta med dig!

Med vänliga hälsningar,
Orchestra System`,
        variables: ['firstName', 'projectName', 'position', 'startDate', 'rehearsalSchedule', 'concertInfo', 'attachmentNote']
      },
      {
        type: 'position_filled',
        subject: 'Tjänsten är tillsatt - {{projectName}}',
        body: `Hej {{firstName}}!

Tack för ditt intresse för vikariatet som {{position}} för {{projectName}}.

Tjänsten har nu tillsatts av annan musiker.

Vi hoppas få möjlighet att arbeta med dig vid ett annat tillfälle!

Med vänliga hälsningar,
Orchestra System`,
        variables: ['firstName', 'projectName', 'position']
      },
      // English versions
      {
        type: 'request_en',
        subject: 'Substitute Request - {{projectName}}',
        body: `Hello {{firstName}}!

We are looking for a {{position}} for {{projectName}} starting {{startDate}}.

{{#if rehearsalSchedule}}
Rehearsal schedule:
{{rehearsalSchedule}}
{{/if}}

{{#if concertInfo}}
Concert information:
{{concertInfo}}
{{/if}}

{{#if attachmentNote}}
{{attachmentNote}}
{{/if}}

Please respond within {{responseTime}}:

✅ YES, I can: {{yesLink}}
❌ NO, I cannot: {{noLink}}

Best regards,
Orchestra System`,
        variables: ['firstName', 'projectName', 'position', 'instrument', 'startDate', 'weekNumber', 'rehearsalSchedule', 'concertInfo', 'responseTime', 'yesLink', 'noLink', 'attachmentNote']
      }
    ]
    
    // Create all templates
    console.log('Creating email templates...')
    
    for (const template of templates) {
      // Generate unique ID
      const lastTemplate = await prisma.emailTemplate.findFirst({
        orderBy: { emailTemplateId: 'desc' }
      })
      
      let nextNumber = 1
      if (lastTemplate && lastTemplate.emailTemplateId) {
        const match = lastTemplate.emailTemplateId.match(/TMPL(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }
      
      const emailTemplateId = `TMPL${nextNumber.toString().padStart(3, '0')}`
      
      await prisma.emailTemplate.create({
        data: {
          emailTemplateId,
          type: template.type,
          subject: template.subject,
          body: template.body,
          variables: template.variables
        }
      })
      
      console.log(`✅ Created template: ${template.type}`)
    }
    
    console.log('\n✅ All email templates created successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedScosoTemplates()
  .then(() => {
    console.log('\n✅ SCOSO template seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ SCOSO template seeding failed:', error)
    process.exit(1)
  })