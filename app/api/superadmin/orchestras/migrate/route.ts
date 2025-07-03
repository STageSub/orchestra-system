import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Use Node.js runtime to support database operations
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { databaseUrl } = await request.json()
    
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'Database URL required' },
        { status: 400 }
      )
    }
    
    console.log('Running migrations on new database...')
    
    // Create a Prisma client for the target database
    const targetPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })
    
    try {
      // SQL to create all tables - split into smaller chunks to avoid issues
      const sqlStatements = [
        // Musician table
        `CREATE TABLE "Musician" (
          "id" SERIAL NOT NULL,
          "musicianId" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "preferredLanguage" TEXT DEFAULT 'sv',
          "localResidence" BOOLEAN NOT NULL DEFAULT false,
          "notes" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isArchived" BOOLEAN NOT NULL DEFAULT false,
          "archivedAt" TIMESTAMP(3),
          "restoredAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Musician_pkey" PRIMARY KEY ("id")
        )`,
        
        // Musician indexes
        `CREATE UNIQUE INDEX "Musician_musicianId_key" ON "Musician"("musicianId")`,
        `CREATE UNIQUE INDEX "Musician_email_key" ON "Musician"("email")`,
        
        // Instrument table
        `CREATE TABLE "Instrument" (
          "id" SERIAL NOT NULL,
          "instrumentId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "displayOrder" INTEGER,
          "isArchived" BOOLEAN NOT NULL DEFAULT false,
          "archivedAt" TIMESTAMP(3),
          CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
        )`,
        
        // Instrument indexes
        `CREATE UNIQUE INDEX "Instrument_instrumentId_key" ON "Instrument"("instrumentId")`,
        `CREATE UNIQUE INDEX "Instrument_name_key" ON "Instrument"("name")`,
        
        // Position table
        `CREATE TABLE "Position" (
          "id" SERIAL NOT NULL,
          "positionId" TEXT NOT NULL,
          "instrumentId" INTEGER NOT NULL,
          "name" TEXT NOT NULL,
          "hierarchyLevel" INTEGER NOT NULL,
          CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
        )`,
        
        // Position indexes
        `CREATE UNIQUE INDEX "Position_positionId_key" ON "Position"("positionId")`,
        `CREATE UNIQUE INDEX "Position_instrumentId_name_key" ON "Position"("instrumentId", "name")`,
        
        // MusicianQualification table
        `CREATE TABLE "MusicianQualification" (
          "musicianId" INTEGER NOT NULL,
          "positionId" INTEGER NOT NULL,
          CONSTRAINT "MusicianQualification_pkey" PRIMARY KEY ("musicianId","positionId")
        )`,
        
        // RankingList table
        `CREATE TABLE "RankingList" (
          "id" SERIAL NOT NULL,
          "rankingListId" TEXT NOT NULL,
          "positionId" INTEGER NOT NULL,
          "listType" TEXT NOT NULL,
          "description" TEXT,
          "version" INTEGER NOT NULL DEFAULT 1,
          CONSTRAINT "RankingList_pkey" PRIMARY KEY ("id")
        )`,
        
        // RankingList indexes
        `CREATE UNIQUE INDEX "RankingList_rankingListId_key" ON "RankingList"("rankingListId")`,
        `CREATE UNIQUE INDEX "RankingList_positionId_listType_key" ON "RankingList"("positionId", "listType")`,
        
        // Ranking table
        `CREATE TABLE "Ranking" (
          "id" SERIAL NOT NULL,
          "rankingId" TEXT NOT NULL,
          "listId" INTEGER NOT NULL,
          "musicianId" INTEGER NOT NULL,
          "rank" INTEGER NOT NULL,
          CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
        )`,
        
        // Ranking indexes
        `CREATE UNIQUE INDEX "Ranking_rankingId_key" ON "Ranking"("rankingId")`,
        `CREATE UNIQUE INDEX "Ranking_listId_musicianId_key" ON "Ranking"("listId", "musicianId")`,
        `CREATE UNIQUE INDEX "Ranking_listId_rank_key" ON "Ranking"("listId", "rank")`,
        
        // Project table
        `CREATE TABLE "Project" (
          "id" SERIAL NOT NULL,
          "projectId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "startDate" TIMESTAMP(3) NOT NULL,
          "weekNumber" INTEGER NOT NULL,
          "rehearsalSchedule" TEXT,
          "concertInfo" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "notes" TEXT,
          CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
        )`,
        
        // Project indexes
        `CREATE UNIQUE INDEX "Project_projectId_key" ON "Project"("projectId")`,
        
        // ProjectNeed table
        `CREATE TABLE "ProjectNeed" (
          "id" SERIAL NOT NULL,
          "projectNeedId" TEXT NOT NULL,
          "projectId" INTEGER NOT NULL,
          "positionId" INTEGER NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "rankingListId" INTEGER NOT NULL,
          "requestStrategy" TEXT NOT NULL,
          "maxRecipients" INTEGER,
          "responseTimeHours" INTEGER DEFAULT 24,
          "requireLocalResidence" BOOLEAN NOT NULL DEFAULT false,
          "archivedAt" TIMESTAMP(3),
          "status" TEXT NOT NULL DEFAULT 'active',
          CONSTRAINT "ProjectNeed_pkey" PRIMARY KEY ("id")
        )`,
        
        // ProjectNeed indexes
        `CREATE UNIQUE INDEX "ProjectNeed_projectNeedId_key" ON "ProjectNeed"("projectNeedId")`,
        
        // Request table
        `CREATE TABLE "Request" (
          "id" SERIAL NOT NULL,
          "requestId" TEXT NOT NULL,
          "projectNeedId" INTEGER NOT NULL,
          "musicianId" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "reminderSentAt" TIMESTAMP(3),
          "respondedAt" TIMESTAMP(3),
          "response" TEXT,
          "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
        )`,
        
        // Request indexes
        `CREATE UNIQUE INDEX "Request_requestId_key" ON "Request"("requestId")`,
        
        // RequestToken table
        `CREATE TABLE "RequestToken" (
          "token" TEXT NOT NULL,
          "requestId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "usedAt" TIMESTAMP(3),
          CONSTRAINT "RequestToken_pkey" PRIMARY KEY ("token")
        )`,
        
        // EmailTemplate table
        `CREATE TABLE "EmailTemplate" (
          "id" SERIAL NOT NULL,
          "emailTemplateId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "body" TEXT NOT NULL,
          "variables" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
        )`,
        
        // EmailTemplate indexes
        `CREATE UNIQUE INDEX "EmailTemplate_emailTemplateId_key" ON "EmailTemplate"("emailTemplateId")`,
        `CREATE UNIQUE INDEX "EmailTemplate_type_key" ON "EmailTemplate"("type")`,
        
        // CommunicationLog table
        `CREATE TABLE "CommunicationLog" (
          "id" SERIAL NOT NULL,
          "communicationLogId" TEXT NOT NULL,
          "requestId" INTEGER NOT NULL,
          "type" TEXT NOT NULL,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "emailContent" TEXT,
          CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
        )`,
        
        // CommunicationLog indexes
        `CREATE UNIQUE INDEX "CommunicationLog_communicationLogId_key" ON "CommunicationLog"("communicationLogId")`,
        
        // ProjectFile table
        `CREATE TABLE "ProjectFile" (
          "id" SERIAL NOT NULL,
          "projectFileId" TEXT NOT NULL,
          "projectId" INTEGER NOT NULL,
          "fileName" TEXT NOT NULL,
          "originalFileName" TEXT,
          "mimeType" TEXT,
          "fileUrl" TEXT NOT NULL,
          "fileType" TEXT NOT NULL,
          "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "projectNeedId" INTEGER,
          "sendTiming" TEXT NOT NULL DEFAULT 'on_request',
          CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
        )`,
        
        // ProjectFile indexes
        `CREATE UNIQUE INDEX "ProjectFile_projectFileId_key" ON "ProjectFile"("projectFileId")`,
        
        // AuditLog table
        `CREATE TABLE "AuditLog" (
          "id" SERIAL NOT NULL,
          "auditLogId" TEXT NOT NULL,
          "userId" TEXT,
          "action" TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" INTEGER NOT NULL,
          "oldValues" JSONB,
          "newValues" JSONB,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
        )`,
        
        // AuditLog indexes
        `CREATE UNIQUE INDEX "AuditLog_auditLogId_key" ON "AuditLog"("auditLogId")`,
        `CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId")`,
        `CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp")`,
        
        // IdSequence table
        `CREATE TABLE "IdSequence" (
          "id" SERIAL NOT NULL,
          "entityType" TEXT NOT NULL,
          "lastNumber" INTEGER NOT NULL DEFAULT 0,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "IdSequence_pkey" PRIMARY KEY ("id")
        )`,
        
        // IdSequence indexes
        `CREATE UNIQUE INDEX "IdSequence_entityType_key" ON "IdSequence"("entityType")`,
        
        // DeletedIds table
        `CREATE TABLE "DeletedIds" (
          "id" SERIAL NOT NULL,
          "entityType" TEXT NOT NULL,
          "deletedId" TEXT NOT NULL,
          "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DeletedIds_pkey" PRIMARY KEY ("id")
        )`,
        
        // DeletedIds indexes
        `CREATE INDEX "DeletedIds_entityType_idx" ON "DeletedIds"("entityType")`,
        `CREATE UNIQUE INDEX "DeletedIds_entityType_deletedId_key" ON "DeletedIds"("entityType", "deletedId")`,
        
        // Settings table
        `CREATE TABLE "Settings" (
          "id" SERIAL NOT NULL,
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
        )`,
        
        // Settings indexes
        `CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key")`,
        
        // GroupEmailLog table
        `CREATE TABLE "GroupEmailLog" (
          "id" SERIAL NOT NULL,
          "projectId" INTEGER,
          "subject" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "recipients" JSONB NOT NULL,
          "sentCount" INTEGER NOT NULL,
          "failedCount" INTEGER NOT NULL,
          "filters" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GroupEmailLog_pkey" PRIMARY KEY ("id")
        )`,
        
        // FileStorage table
        `CREATE TABLE "FileStorage" (
          "id" TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          "originalName" TEXT NOT NULL,
          "mimeType" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "content" BYTEA NOT NULL,
          "projectId" INTEGER,
          "needId" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FileStorage_pkey" PRIMARY KEY ("id")
        )`,
        
        // Foreign keys
        `ALTER TABLE "Position" ADD CONSTRAINT "Position_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "MusicianQualification" ADD CONSTRAINT "MusicianQualification_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "MusicianQualification" ADD CONSTRAINT "MusicianQualification_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "RankingList" ADD CONSTRAINT "RankingList_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_listId_fkey" FOREIGN KEY ("listId") REFERENCES "RankingList"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "ProjectNeed" ADD CONSTRAINT "ProjectNeed_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "ProjectNeed" ADD CONSTRAINT "ProjectNeed_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "ProjectNeed" ADD CONSTRAINT "ProjectNeed_rankingListId_fkey" FOREIGN KEY ("rankingListId") REFERENCES "RankingList"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "Request" ADD CONSTRAINT "Request_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "Request" ADD CONSTRAINT "Request_projectNeedId_fkey" FOREIGN KEY ("projectNeedId") REFERENCES "ProjectNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "RequestToken" ADD CONSTRAINT "RequestToken_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
        `ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectNeedId_fkey" FOREIGN KEY ("projectNeedId") REFERENCES "ProjectNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        `ALTER TABLE "GroupEmailLog" ADD CONSTRAINT "GroupEmailLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
        `ALTER TABLE "FileStorage" ADD CONSTRAINT "FileStorage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE`
      ]
      
      // Execute each SQL statement
      for (const sql of sqlStatements) {
        try {
          await targetPrisma.$executeRawUnsafe(sql)
        } catch (error: any) {
          // Ignore errors for already existing tables/indexes
          if (!error.message.includes('already exists')) {
            throw error
          }
        }
      }
      
      console.log('Migrations completed successfully!')
      
      await targetPrisma.$disconnect()
      
      return NextResponse.json({
        success: true,
        message: 'Database migrations completed'
      })
    } catch (error) {
      console.error('Migration error:', error)
      await targetPrisma.$disconnect()
      
      return NextResponse.json(
        { 
          error: 'Failed to run migrations',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}