import { PrismaClient } from '@prisma/client'
import { generateUniqueId } from '../lib/id-generator'

// Get database URL from command line or environment
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL_UPPSALA

if (!DATABASE_URL) {
  console.error('❌ Please provide database URL as argument or set DATABASE_URL_UPPSALA')
  console.error('Usage: npx ts-node scripts/seed-new-orchestra.ts "postgresql://..."')
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function main() {
  console.log('🌱 Seeding new orchestra database...')

  // 1. Create ID sequences
  console.log('Creating ID sequences...')
  const sequences = ['musician', 'instrument', 'position', 'project', 'template']
  
  for (const entityType of sequences) {
    await prisma.idSequence.create({
      data: {
        entityType,
        lastNumber: 0
      }
    })
  }

  // 2. Create basic instruments
  console.log('Creating instruments...')
  const instruments = [
    { name: 'Violin', displayOrder: 1 },
    { name: 'Viola', displayOrder: 2 },
    { name: 'Cello', displayOrder: 3 },
    { name: 'Kontrabas', displayOrder: 4 },
    { name: 'Flöjt', displayOrder: 5 },
    { name: 'Oboe', displayOrder: 6 },
    { name: 'Klarinett', displayOrder: 7 },
    { name: 'Fagott', displayOrder: 8 },
    { name: 'Valthorn', displayOrder: 9 },
    { name: 'Trumpet', displayOrder: 10 },
    { name: 'Trombon', displayOrder: 11 },
    { name: 'Tuba', displayOrder: 12 },
    { name: 'Slagverk', displayOrder: 13 },
    { name: 'Harpa', displayOrder: 14 },
  ]

  for (const inst of instruments) {
    const instrumentId = await generateUniqueId('instrument', prisma)
    await prisma.instrument.create({
      data: {
        ...inst,
        instrumentId
      }
    })
  }

  // 3. Create basic positions for violin as example
  console.log('Creating positions...')
  const violin = await prisma.instrument.findFirst({ where: { name: 'Violin' } })
  
  if (violin) {
    const positions = [
      { name: 'Konsertmästare', hierarchyLevel: 1 },
      { name: 'Alternerande konsertmästare', hierarchyLevel: 2 },
      { name: 'Förste konsertmästare', hierarchyLevel: 3 },
      { name: 'Andre konsertmästare', hierarchyLevel: 4 },
      { name: 'Tutti', hierarchyLevel: 5 },
    ]

    for (const pos of positions) {
      const positionId = await generateUniqueId('position', prisma)
      await prisma.position.create({
        data: {
          ...pos,
          positionId,
          instrumentId: violin.id
        }
      })
    }
  }

  // 4. Create email templates
  console.log('Creating email templates...')
  const templates = [
    {
      type: 'request',
      subject: 'Vikarieförfrågan: {{projectName}}',
      body: `Hej {{firstName}},

Vi söker en {{instrumentName}} ({{positionName}}) för {{projectName}}.

Startdatum: {{startDate}}

Vänligen svara inom {{responseTime}} genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
Orkesteradministrationen`
    },
    {
      type: 'reminder',
      subject: 'Påminnelse: Vikarieförfrågan {{projectName}}',
      body: `Hej {{firstName}},

Detta är en påminnelse om vår vikarieförfrågan för {{projectName}}.

Vänligen svara snarast genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
Orkesteradministrationen`
    },
    {
      type: 'confirmation',
      subject: 'Bekräftelse: {{projectName}}',
      body: `Hej {{firstName}},

Tack för att du accepterat uppdraget som {{instrumentName}} ({{positionName}}) för {{projectName}}.

Startdatum: {{startDate}}

Vi återkommer med mer information närmare projektstart.

Med vänliga hälsningar,
Orkesteradministrationen`
    },
    {
      type: 'position_filled',
      subject: 'Tjänsten är tillsatt: {{projectName}}',
      body: `Hej {{firstName}},

Tack för ditt intresse för {{projectName}}.

Tjänsten som {{instrumentName}} ({{positionName}}) är nu tillsatt.

Vi hoppas kunna höra av oss vid framtida tillfällen.

Med vänliga hälsningar,
Orkesteradministrationen`
    }
  ]

  for (const template of templates) {
    const emailTemplateId = await generateUniqueId('template', prisma)
    await prisma.emailTemplate.create({
      data: {
        ...template,
        emailTemplateId
      }
    })
  }

  // 5. Create settings
  console.log('Creating settings...')
  await prisma.settings.create({
    data: {
      key: 'conflictHandlingStrategy',
      value: 'simple',
      description: 'Konflikthanteringsstrategi för dubbelbokningar'
    }
  })

  console.log('✅ Orchestra database seeded successfully!')
  console.log('📊 Summary:')
  console.log(`- ${instruments.length} instruments created`)
  console.log(`- ${templates.length} email templates created`)
  console.log('- Basic settings configured')
  console.log('\n🎉 Your new orchestra is ready to use!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })