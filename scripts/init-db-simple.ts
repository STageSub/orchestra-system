import { PrismaClient } from '@prisma/client'

async function initDatabase() {
  const databaseUrl = process.argv[2]
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL krävs')
    console.error('Användning: npx tsx scripts/init-db-simple.ts "postgresql://..."')
    process.exit(1)
  }

  console.log('🚀 Initierar ny databas...')

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    // Create tables in correct order (no dependencies first)
    console.log('📦 Skapar grundtabeller...')
    
    // Basic tables
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Musician" (
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
      )`
    console.log('✓ Musician')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Instrument" (
        "id" SERIAL PRIMARY KEY,
        "instrumentId" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL UNIQUE,
        "displayOrder" INTEGER,
        "isArchived" BOOLEAN NOT NULL DEFAULT false,
        "archivedAt" TIMESTAMP(3)
      )`
    console.log('✓ Instrument')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Project" (
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
      )`
    console.log('✓ Project')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EmailTemplate" (
        "id" SERIAL PRIMARY KEY,
        "emailTemplateId" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL UNIQUE,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "variables" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    console.log('✓ EmailTemplate')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    console.log('✓ Settings')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "IdSequence" (
        "id" SERIAL PRIMARY KEY,
        "entityType" TEXT NOT NULL UNIQUE,
        "lastNumber" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    console.log('✓ IdSequence')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DeletedIds" (
        "id" SERIAL PRIMARY KEY,
        "entityType" TEXT NOT NULL,
        "deletedId" TEXT NOT NULL,
        "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("entityType", "deletedId")
      )`
    console.log('✓ DeletedIds')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "FileStorage" (
        "id" TEXT PRIMARY KEY,
        "fileName" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "content" BYTEA NOT NULL,
        "projectId" INTEGER,
        "needId" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    console.log('✓ FileStorage')

    console.log('\n📦 Skapar beroende tabeller...')

    // Tables with dependencies
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Position" (
        "id" SERIAL PRIMARY KEY,
        "positionId" TEXT NOT NULL UNIQUE,
        "instrumentId" INTEGER NOT NULL REFERENCES "Instrument"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "hierarchyLevel" INTEGER NOT NULL,
        UNIQUE("instrumentId", "name")
      )`
    console.log('✓ Position')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "RankingList" (
        "id" SERIAL PRIMARY KEY,
        "rankingListId" TEXT NOT NULL UNIQUE,
        "positionId" INTEGER NOT NULL REFERENCES "Position"("id") ON DELETE CASCADE,
        "listType" TEXT NOT NULL,
        "description" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        UNIQUE("positionId", "listType")
      )`
    console.log('✓ RankingList')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MusicianQualification" (
        "musicianId" INTEGER NOT NULL REFERENCES "Musician"("id"),
        "positionId" INTEGER NOT NULL REFERENCES "Position"("id"),
        PRIMARY KEY ("musicianId", "positionId")
      )`
    console.log('✓ MusicianQualification')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Ranking" (
        "id" SERIAL PRIMARY KEY,
        "rankingId" TEXT NOT NULL UNIQUE,
        "listId" INTEGER NOT NULL REFERENCES "RankingList"("id") ON DELETE CASCADE,
        "musicianId" INTEGER NOT NULL REFERENCES "Musician"("id"),
        "rank" INTEGER NOT NULL,
        UNIQUE("listId", "musicianId"),
        UNIQUE("listId", "rank")
      )`
    console.log('✓ Ranking')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ProjectNeed" (
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
      )`
    console.log('✓ ProjectNeed')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Request" (
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
      )`
    console.log('✓ Request')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "RequestToken" (
        "token" TEXT PRIMARY KEY,
        "requestId" INTEGER NOT NULL REFERENCES "Request"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "usedAt" TIMESTAMP(3)
      )`
    console.log('✓ RequestToken')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CommunicationLog" (
        "id" SERIAL PRIMARY KEY,
        "communicationLogId" TEXT NOT NULL UNIQUE,
        "requestId" INTEGER NOT NULL REFERENCES "Request"("id") ON DELETE CASCADE,
        "type" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "emailContent" TEXT
      )`
    console.log('✓ CommunicationLog')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ProjectFile" (
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
      )`
    console.log('✓ ProjectFile')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "GroupEmailLog" (
        "id" SERIAL PRIMARY KEY,
        "projectId" INTEGER REFERENCES "Project"("id") ON DELETE SET NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "recipients" JSONB NOT NULL,
        "sentCount" INTEGER NOT NULL,
        "failedCount" INTEGER NOT NULL,
        "filters" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    console.log('✓ GroupEmailLog')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
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
    console.log('✓ AuditLog')

    console.log('\n✅ Alla tabeller skapade!')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

initDatabase()