import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function setupOrchestraComplete() {
  const databaseUrl = process.argv[2]
  const orchestraName = process.argv[3] || 'Orchestra'
  const subdomain = process.argv[4]
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL krävs')
    console.error('Användning: npx tsx scripts/setup-orchestra-complete.ts "postgresql://..." "Orchestra Name" "subdomain"')
    process.exit(1)
  }

  console.log('🚀 Sätter upp komplett orkesterdatabas...')
  console.log(`📊 Orchestra: ${orchestraName}`)
  console.log(`🌐 Subdomain: ${subdomain || 'N/A'}`)

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    // 1. Create all tables
    console.log('\n📦 Skapar tabeller...')
    await createTables(prisma)
    
    // 2. Mark failed migrations as resolved
    console.log('\n🔧 Markerar migrationer som lösta...')
    await markMigrationsResolved(prisma)
    
    // 3. Create email templates
    console.log('\n📧 Skapar e-postmallar...')
    await createEmailTemplates(prisma, orchestraName)
    
    // 4. Create instruments with positions and ranking lists
    console.log('\n🎼 Skapar instrument och rankningslistor...')
    await createInstrumentsAndRankings(prisma)
    
    // 5. Update orchestra status if subdomain provided
    if (subdomain) {
      console.log('\n✅ Uppdaterar orkesterstatus...')
      await updateOrchestraStatus(subdomain)
    }
    
    console.log('\n🎉 Orkesterdatabas komplett uppsatt!')
    console.log('Du kan nu logga in med admin-uppgifterna som visades tidigare.')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

async function createTables(prisma: PrismaClient) {
  // Basic tables
  const basicTables = [
    `CREATE TABLE IF NOT EXISTS "Musician" (
      "id" SERIAL PRIMARY KEY,
      "musicianId" TEXT NOT NULL UNIQUE,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "phone" TEXT,
      "preferredLanguage" TEXT DEFAULT 'sv',
      "localResidence" BOOLEAN NOT NULL DEFAULT false,
      "notes" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isArchived" BOOLEAN NOT NULL DEFAULT false,
      "archivedAt" TIMESTAMP(3),
      "restoredAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "Instrument" (
      "id" SERIAL PRIMARY KEY,
      "instrumentId" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL UNIQUE,
      "displayOrder" INTEGER NOT NULL,
      "isArchived" BOOLEAN NOT NULL DEFAULT false,
      "archivedAt" TIMESTAMP(3)
    )`,
    
    `CREATE TABLE IF NOT EXISTS "Project" (
      "id" SERIAL PRIMARY KEY,
      "projectId" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "startDate" TIMESTAMP(3) NOT NULL,
      "weekNumber" INTEGER NOT NULL,
      "rehearsalSchedule" TEXT,
      "concertInfo" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "EmailTemplate" (
      "id" SERIAL PRIMARY KEY,
      "emailTemplateId" TEXT NOT NULL UNIQUE,
      "type" TEXT NOT NULL UNIQUE,
      "subject" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "variables" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "Settings" (
      "id" SERIAL PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "IdSequence" (
      "id" SERIAL PRIMARY KEY,
      "entityType" TEXT NOT NULL UNIQUE,
      "lastNumber" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "DeletedIds" (
      "id" SERIAL PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "deletedId" TEXT NOT NULL,
      "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("entityType", "deletedId")
    )`,
    
    `CREATE TABLE IF NOT EXISTS "FileStorage" (
      "id" TEXT PRIMARY KEY,
      "fileName" TEXT NOT NULL,
      "originalName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "content" BYTEA NOT NULL,
      "projectId" INTEGER,
      "needId" INTEGER,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )`
  ]

  for (const sql of basicTables) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error
      }
    }
  }

  // Dependent tables
  const dependentTables = [
    `CREATE TABLE IF NOT EXISTS "Position" (
      "id" SERIAL PRIMARY KEY,
      "positionId" TEXT NOT NULL UNIQUE,
      "instrumentId" INTEGER NOT NULL REFERENCES "Instrument"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "hierarchyLevel" INTEGER NOT NULL,
      UNIQUE("instrumentId", "name")
    )`,
    
    `CREATE TABLE IF NOT EXISTS "RankingList" (
      "id" SERIAL PRIMARY KEY,
      "rankingListId" TEXT NOT NULL UNIQUE,
      "positionId" INTEGER NOT NULL REFERENCES "Position"("id") ON DELETE CASCADE,
      "listType" TEXT NOT NULL,
      "description" TEXT,
      "version" INTEGER NOT NULL DEFAULT 1,
      UNIQUE("positionId", "listType")
    )`,
    
    // ... rest of dependent tables
    `CREATE TABLE IF NOT EXISTS "MusicianQualification" (
      "musicianId" INTEGER NOT NULL REFERENCES "Musician"("id"),
      "positionId" INTEGER NOT NULL REFERENCES "Position"("id"),
      PRIMARY KEY ("musicianId", "positionId")
    )`,
    
    `CREATE TABLE IF NOT EXISTS "Ranking" (
      "id" SERIAL PRIMARY KEY,
      "rankingId" TEXT NOT NULL UNIQUE,
      "listId" INTEGER NOT NULL REFERENCES "RankingList"("id") ON DELETE CASCADE,
      "musicianId" INTEGER NOT NULL REFERENCES "Musician"("id"),
      "rank" INTEGER NOT NULL,
      UNIQUE("listId", "musicianId"),
      UNIQUE("listId", "rank")
    )`,
    
    `CREATE TABLE IF NOT EXISTS "ProjectNeed" (
      "id" SERIAL PRIMARY KEY,
      "projectNeedId" TEXT NOT NULL UNIQUE,
      "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
      "positionId" INTEGER NOT NULL REFERENCES "Position"("id") ON DELETE CASCADE,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "rankingListId" INTEGER NOT NULL REFERENCES "RankingList"("id") ON DELETE CASCADE,
      "requestStrategy" TEXT NOT NULL,
      "maxRecipients" INTEGER,
      "responseTimeHours" INTEGER DEFAULT 24,
      "requireLocalResidence" BOOLEAN NOT NULL DEFAULT false,
      "archivedAt" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'active'
    )`,
    
    `CREATE TABLE IF NOT EXISTS "Request" (
      "id" SERIAL PRIMARY KEY,
      "requestId" TEXT NOT NULL UNIQUE,
      "projectNeedId" INTEGER NOT NULL REFERENCES "ProjectNeed"("id") ON DELETE CASCADE,
      "musicianId" INTEGER NOT NULL REFERENCES "Musician"("id"),
      "status" TEXT NOT NULL DEFAULT 'pending',
      "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "reminderSentAt" TIMESTAMP(3),
      "respondedAt" TIMESTAMP(3),
      "response" TEXT,
      "confirmationSent" BOOLEAN NOT NULL DEFAULT false
    )`,
    
    `CREATE TABLE IF NOT EXISTS "RequestToken" (
      "token" TEXT PRIMARY KEY,
      "requestId" INTEGER NOT NULL REFERENCES "Request"("id") ON DELETE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3)
    )`,
    
    `CREATE TABLE IF NOT EXISTS "CommunicationLog" (
      "id" SERIAL PRIMARY KEY,
      "communicationLogId" TEXT NOT NULL UNIQUE,
      "requestId" INTEGER NOT NULL REFERENCES "Request"("id") ON DELETE CASCADE,
      "type" TEXT NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "emailContent" TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS "ProjectFile" (
      "id" SERIAL PRIMARY KEY,
      "projectFileId" TEXT NOT NULL UNIQUE,
      "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
      "fileName" TEXT NOT NULL,
      "originalFileName" TEXT,
      "mimeType" TEXT,
      "fileUrl" TEXT NOT NULL,
      "fileType" TEXT NOT NULL,
      "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "projectNeedId" INTEGER REFERENCES "ProjectNeed"("id") ON DELETE CASCADE,
      "sendTiming" TEXT NOT NULL DEFAULT 'on_request'
    )`,
    
    `CREATE TABLE IF NOT EXISTS "GroupEmailLog" (
      "id" SERIAL PRIMARY KEY,
      "projectId" INTEGER REFERENCES "Project"("id") ON DELETE SET NULL,
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "recipients" JSONB NOT NULL,
      "sentCount" INTEGER NOT NULL,
      "failedCount" INTEGER NOT NULL,
      "filters" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" SERIAL PRIMARY KEY,
      "auditLogId" TEXT NOT NULL UNIQUE,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" INTEGER NOT NULL,
      "oldValues" JSONB,
      "newValues" JSONB,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  for (const sql of dependentTables) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error
      }
    }
  }

  console.log('✓ Alla tabeller skapade')
}

async function markMigrationsResolved(prisma: PrismaClient) {
  // Mark any failed migrations as resolved
  const migrations = [
    '20250627170040_make_display_order_required',
    '20250630104415_add_preferred_language_to_musician'
  ]

  for (const migration of migrations) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
        VALUES (${migration}, 'resolved', ${migration}, NOW(), 1)
        ON CONFLICT (id) DO UPDATE SET finished_at = NOW(), logs = NULL
      `
    } catch (error) {
      // Ignore errors
    }
  }

  console.log('✓ Migrationer markerade som lösta')
}

async function createEmailTemplates(prisma: PrismaClient, orchestraName: string) {
  const templates = [
    // Svenska mallar
    {
      emailTemplateId: 'template-request-sv',
      type: 'request',
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
      emailTemplateId: 'template-reminder-sv',
      type: 'reminder',
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
      emailTemplateId: 'template-confirmation-sv',
      type: 'confirmation',
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
      emailTemplateId: 'template-position-filled-sv',
      type: 'position_filled',
      subject: 'Tjänsten är tillsatt - {{projectName}}',
      body: `Hej {{firstName}},

Tack för ditt intresse för tjänsten som {{positionName}} för {{projectName}}.

Tjänsten är nu tillsatt.

Med vänliga hälsningar,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName']
    },
    // Engelska mallar
    {
      emailTemplateId: 'template-request-en',
      type: 'request_en',
      subject: 'Substitute Request - {{projectName}}',
      body: `Hello {{firstName}},

We are looking for a {{positionName}} for {{projectName}} starting {{startDate}}.

Please respond within {{responseTime}} hours by clicking the link below:
{{responseUrl}}

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate', 'responseTime', 'responseUrl']
    },
    {
      emailTemplateId: 'template-reminder-en',
      type: 'reminder_en',
      subject: 'Reminder: Substitute Request - {{projectName}}',
      body: `Hello {{firstName}},

This is a reminder about our request for the {{positionName}} position in {{projectName}}.

Please respond as soon as possible by clicking the link below:
{{responseUrl}}

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'responseUrl']
    },
    {
      emailTemplateId: 'template-confirmation-en',
      type: 'confirmation_en',
      subject: 'Confirmation: {{projectName}}',
      body: `Hello {{firstName}},

Thank you for accepting the position as {{positionName}} for {{projectName}}.

Start date: {{startDate}}

We will send you more information soon.

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate']
    },
    {
      emailTemplateId: 'template-position-filled-en',
      type: 'position_filled_en',
      subject: 'Position Filled - {{projectName}}',
      body: `Hello {{firstName}},

Thank you for your interest in the {{positionName}} position for {{projectName}}.

The position has now been filled.

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName']
    }
  ]

  for (const template of templates) {
    try {
      await prisma.emailTemplate.create({
        data: template
      })
    } catch (error: any) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`Failed to create template ${template.type}:`, error.message)
      }
    }
  }

  console.log('✓ E-postmallar skapade')
}

async function createInstrumentsAndRankings(prisma: PrismaClient) {
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
    // Create instrument
    const instrument = await prisma.instrument.create({
      data: {
        instrumentId: `INST${String(instrumentData.displayOrder).padStart(3, '0')}`,
        name: instrumentData.name,
        displayOrder: instrumentData.displayOrder
      }
    })

    // Create positions
    for (const positionData of instrumentData.positions) {
      totalPositions++
      const position = await prisma.position.create({
        data: {
          positionId: `POS${String(totalPositions).padStart(3, '0')}`,
          name: positionData.name,
          hierarchyLevel: positionData.hierarchyLevel,
          instrumentId: instrument.id
        }
      })

      // Create A, B, C ranking lists for each position
      const listTypes = ['A', 'B', 'C']
      for (const listType of listTypes) {
        totalRankingLists++
        await prisma.rankingList.create({
          data: {
            rankingListId: `RANK${String(totalRankingLists).padStart(3, '0')}`,
            listType: listType,
            description: `${listType}-lista för ${position.name} (${instrument.name})`,
            positionId: position.id
          }
        })
      }
    }
  }

  console.log(`✓ Skapade ${instrumentsData.length} instrument`)
  console.log(`✓ Skapade ${totalPositions} positioner`)
  console.log(`✓ Skapade ${totalRankingLists} rankningslistor`)
}

async function updateOrchestraStatus(subdomain: string) {
  // Update status in main database
  const mainPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    await mainPrisma.orchestra.update({
      where: { subdomain },
      data: { status: 'active' }
    })
    console.log('✓ Orkesterstatus uppdaterad till aktiv')
  } catch (error) {
    console.error('Kunde inte uppdatera orkesterstatus:', error)
  } finally {
    await mainPrisma.$disconnect()
  }
}

// Run the setup
setupOrchestraComplete()