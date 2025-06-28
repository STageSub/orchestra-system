import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create instruments and their positions
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

  console.log('🎻 Seeding instruments and positions...')

  for (const instrumentData of instrumentsData) {
    const instrument = await prisma.instrument.create({
      data: {
        name: instrumentData.name,
        displayOrder: instrumentData.displayOrder
      }
    })

    console.log(`✅ Created instrument: ${instrument.name}`)

    for (const positionData of instrumentData.positions) {
      const position = await prisma.position.create({
        data: {
          name: positionData.name,
          hierarchyLevel: positionData.hierarchyLevel,
          instrumentId: instrument.id
        }
      })

      console.log(`  - Added position: ${position.name}`)
    }
  }

  // Create email templates
  console.log('\n📧 Seeding email templates...')

  const emailTemplates = [
    {
      type: 'request',
      subject: 'Förfrågan om vikariat - {projectName} - {position}',
      body: `Hej {firstName},

Vi söker en {position} för {projectName}.

Startdatum: {startDate} - vecka {weekNumber}
Repetitioner: {rehearsalSchedule}
Konserter: {concertInfo}

Vänligen svara inom {responseTime} timmar genom att klicka på en av knapparna nedan:

[Svara JA]({yesLink}) | [Svara NEJ]({noLink})

Med vänliga hälsningar,
Orkesteradministrationen`,
      variables: ['firstName', 'projectName', 'position', 'startDate', 'weekNumber', 'rehearsalSchedule', 'concertInfo', 'responseTime', 'yesLink', 'noLink']
    },
    {
      type: 'reminder',
      subject: 'Påminnelse - Svar önskas angående {projectName}',
      body: `Hej {firstName},

Detta är en påminnelse om vår förfrågan för {projectName}.
Vänligen svara snarast möjligt.

[Svara JA]({yesLink}) | [Svara NEJ]({noLink})

Med vänliga hälsningar,
Orkesteradministrationen`,
      variables: ['firstName', 'projectName', 'yesLink', 'noLink']
    },
    {
      type: 'confirmation',
      subject: 'Bekräftelse - {projectName}',
      body: `Hej {firstName},

Tack för ditt svar! Du är nu bokad för {position} i {projectName}.

Startdatum: {startDate} - vecka {weekNumber}
Repetitioner: {rehearsalSchedule}
Konserter: {concertInfo}

{attachmentNote}

Vi återkommer med mer information närmare projektstart.

Med vänliga hälsningar,
Orkesteradministrationen`,
      variables: ['firstName', 'projectName', 'position', 'startDate', 'weekNumber', 'rehearsalSchedule', 'concertInfo', 'attachmentNote']
    },
    {
      type: 'position_filled',
      subject: '{projectName} - Platsen är tyvärr redan tillsatt',
      body: `Hej {firstName},

Tack för ditt snabba svar angående {position} för {projectName}.

Platsen är tyvärr redan tillsatt. Vi hör av oss vid nästa tillfälle!

Med vänliga hälsningar,
Orkesteradministrationen`,
      variables: ['firstName', 'projectName', 'position']
    }
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.create({
      data: {
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables
      }
    })

    console.log(`✅ Created email template: ${template.type}`)
  }

  // Create ID sequences
  console.log('\n🔢 Seeding ID sequences...')
  
  const idSequences = [
    'musician', 'project', 'request', 'instrument', 'position',
    'rankingList', 'ranking', 'projectNeed', 'emailTemplate',
    'communicationLog', 'projectFile', 'auditLog'
  ]
  
  for (const entityType of idSequences) {
    await prisma.idSequence.create({
      data: {
        entityType,
        lastNumber: 0
      }
    })
    console.log(`✅ Created ID sequence for: ${entityType}`)
  }

  console.log('\n✨ Seed data created successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding data:', e)
    await prisma.$disconnect()
    process.exit(1)
  })