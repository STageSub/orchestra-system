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
  const sequences = ['musician', 'instrument', 'position', 'project', 'template', 'rankingList']
  
  for (const entityType of sequences) {
    await prisma.idSequence.create({
      data: {
        entityType,
        lastNumber: 0
      }
    })
  }

  // 2. Create instruments with positions and ranking lists
  console.log('Creating instruments, positions, and ranking lists...')
  
  const instrumentsData = [
    {
      name: 'Violin',
      displayOrder: 1,
      positions: [
        { name: 'Förste konsertmästare', hierarchyLevel: 1 },
        { name: 'Andre konsertmästare', hierarchyLevel: 2 },
        { name: 'Stämledare violin 2', hierarchyLevel: 3 },
        { name: 'Tutti violin 1', hierarchyLevel: 4 },
        { name: 'Tutti violin 2', hierarchyLevel: 5 }
      ]
    },
    {
      name: 'Viola',
      displayOrder: 2,
      positions: [
        { name: 'Stämledare', hierarchyLevel: 1 },
        { name: 'Alternerande stämledare', hierarchyLevel: 2 },
        { name: 'Tutti', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Cello',
      displayOrder: 3,
      positions: [
        { name: 'Solocellist', hierarchyLevel: 1 },
        { name: 'Alternerande stämledare', hierarchyLevel: 2 },
        { name: 'Tutti', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Kontrabas',
      displayOrder: 4,
      positions: [
        { name: 'Stämledare', hierarchyLevel: 1 },
        { name: 'Tutti', hierarchyLevel: 2 }
      ]
    },
    {
      name: 'Flöjt',
      displayOrder: 5,
      positions: [
        { name: 'Soloflöjt', hierarchyLevel: 1 },
        { name: 'Stämledare flöjt 2', hierarchyLevel: 2 },
        { name: 'Piccolaflöjt', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Oboe',
      displayOrder: 6,
      positions: [
        { name: 'Solooboe', hierarchyLevel: 1 },
        { name: 'Stämledare oboe 2', hierarchyLevel: 2 },
        { name: 'Engelskt horn', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Klarinett',
      displayOrder: 7,
      positions: [
        { name: 'Soloklarinett', hierarchyLevel: 1 },
        { name: 'Stämledare klarinett 2', hierarchyLevel: 2 },
        { name: 'Essklarinett', hierarchyLevel: 3 },
        { name: 'Basklarinett', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Fagott',
      displayOrder: 8,
      positions: [
        { name: 'Solofagott', hierarchyLevel: 1 },
        { name: 'Stämledare fagott 2', hierarchyLevel: 2 },
        { name: 'Kontrafagott', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Valthorn',
      displayOrder: 9,
      positions: [
        { name: 'Solovalthorn', hierarchyLevel: 1 },
        { name: 'Stämledare valthorn 2', hierarchyLevel: 2 },
        { name: 'Valthorn 3', hierarchyLevel: 3 },
        { name: 'Valthorn 4', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Trumpet',
      displayOrder: 10,
      positions: [
        { name: 'Solotrumpet', hierarchyLevel: 1 },
        { name: 'Stämledare trumpet 2', hierarchyLevel: 2 },
        { name: 'Trumpet 3', hierarchyLevel: 3 },
        { name: 'Kornet', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Trombon',
      displayOrder: 11,
      positions: [
        { name: 'Solotrombon', hierarchyLevel: 1 },
        { name: 'Trombon 2', hierarchyLevel: 2 },
        { name: 'Bastrombon', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Tuba',
      displayOrder: 12,
      positions: [
        { name: 'Solotuba', hierarchyLevel: 1 }
      ]
    },
    {
      name: 'Slagverk',
      displayOrder: 13,
      positions: [
        { name: 'Soloslagverk', hierarchyLevel: 1 },
        { name: 'Slagverk 2', hierarchyLevel: 2 },
        { name: 'Puka', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Harpa',
      displayOrder: 14,
      positions: [
        { name: 'Soloharpa', hierarchyLevel: 1 },
        { name: 'Harpa 2', hierarchyLevel: 2 }
      ]
    }
  ]

  let totalPositions = 0
  let totalRankingLists = 0

  for (const instrumentData of instrumentsData) {
    const instrumentId = await generateUniqueId('instrument', prisma)
    const instrument = await prisma.instrument.create({
      data: {
        instrumentId,
        name: instrumentData.name,
        displayOrder: instrumentData.displayOrder
      }
    })

    for (const positionData of instrumentData.positions) {
      const positionId = await generateUniqueId('position', prisma)
      const position = await prisma.position.create({
        data: {
          positionId,
          name: positionData.name,
          hierarchyLevel: positionData.hierarchyLevel,
          instrumentId: instrument.id
        }
      })
      totalPositions++

      // Create A, B, C ranking lists for each position
      const listTypes = ['A', 'B', 'C'] as const
      for (const listType of listTypes) {
        const rankingListId = await generateUniqueId('rankingList', prisma)
        await prisma.rankingList.create({
          data: {
            rankingListId,
            listType: listType,
            description: `${listType}-lista för ${position.name} (${instrument.name})`,
            positionId: position.id
          }
        })
        totalRankingLists++
      }
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

  // Create English email templates
  console.log('Creating English email templates...')
  const englishTemplates = [
    {
      type: 'request_en',
      subject: 'Substitute Request: {{projectName}}',
      body: `Hello {{firstName}},

We are looking for a {{instrumentName}} ({{positionName}}) for {{projectName}}.

Start date: {{startDate}}

Please respond within {{responseTime}} by clicking the link below:
{{responseUrl}}

Best regards,
Orchestra Administration`
    },
    {
      type: 'reminder_en',
      subject: 'Reminder: Substitute Request {{projectName}}',
      body: `Hello {{firstName}},

This is a reminder about our substitute request for {{projectName}}.

Please respond as soon as possible by clicking the link below:
{{responseUrl}}

Best regards,
Orchestra Administration`
    },
    {
      type: 'confirmation_en',
      subject: 'Confirmation: {{projectName}}',
      body: `Hello {{firstName}},

Thank you for accepting the position as {{instrumentName}} ({{positionName}}) for {{projectName}}.

Start date: {{startDate}}

We will send you more information closer to the project start.

Best regards,
Orchestra Administration`
    },
    {
      type: 'position_filled_en',
      subject: 'Position Filled: {{projectName}}',
      body: `Hello {{firstName}},

Thank you for your interest in {{projectName}}.

The position for {{instrumentName}} ({{positionName}}) has now been filled.

We hope to contact you for future opportunities.

Best regards,
Orchestra Administration`
    }
  ]

  for (const template of englishTemplates) {
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
  console.log(`- ${instrumentsData.length} instruments created`)
  console.log(`- ${totalPositions} positions created`)
  console.log(`- ${totalRankingLists} ranking lists created (A, B, C for each position)`)
  console.log(`- ${templates.length + englishTemplates.length} email templates created (${templates.length} Swedish + ${englishTemplates.length} English)`)
  console.log('- Basic settings configured')
  console.log('\n🎉 Your new orchestra is ready to use with complete instrument setup!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })