-- Safe fix for IdSequence table to remove multi-tenant changes
-- This script handles cases where constraints might already exist

-- Step 1: Remove tenantId column from IdSequence if it exists
ALTER TABLE "IdSequence" DROP COLUMN IF EXISTS "tenantId";

-- Step 2: Remove compound constraint if it exists
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_tenantId_key";

-- Step 3: Check and ensure entityType is unique (don't add if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'IdSequence_entityType_key' 
        AND conrelid = '"IdSequence"'::regclass
    ) THEN
        ALTER TABLE "IdSequence" ADD CONSTRAINT "IdSequence_entityType_key" UNIQUE ("entityType");
    END IF;
END $$;

-- Step 4: Remove tenant-related tables if they exist
DROP TABLE IF EXISTS "UserInvitation" CASCADE;
DROP TABLE IF EXISTS "TenantSubscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Step 5: Remove tenantId columns from all tables if they exist
ALTER TABLE "Musician" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Instrument" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Settings" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "EmailTemplate" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CommunicationLog" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "RankingList" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "DeletedIds" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "ProjectNeed" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Request" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Ranking" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "MusicianQualification" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Position" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "ProjectFile" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "RequestToken" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "AuditLog" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "GroupEmailLog" DROP COLUMN IF EXISTS "tenantId";

-- Step 6: Ensure IdSequence has all needed entity types
INSERT INTO "IdSequence" ("entityType", "lastNumber") 
VALUES 
  ('musician', 0),
  ('project', 0),
  ('request', 0),
  ('instrument', 0),
  ('position', 0),
  ('rankingList', 0),
  ('ranking', 0),
  ('projectNeed', 0),
  ('emailTemplate', 0),
  ('communicationLog', 0),
  ('projectFile', 0),
  ('auditLog', 0)
ON CONFLICT ("entityType") DO NOTHING;

-- Step 7: Update the lastNumber for existing records based on actual data
-- Only update if there are actual records
DO $$
BEGIN
    -- Update musician sequence
    IF EXISTS (SELECT 1 FROM "Musician" LIMIT 1) THEN
        UPDATE "IdSequence" SET "lastNumber" = (
            SELECT COALESCE(MAX(
                CAST(SUBSTRING("musicianId" FROM '[0-9]+') AS INTEGER)
            ), 0)
            FROM "Musician"
            WHERE "musicianId" ~ '^MUS[0-9]+$'
        ) WHERE "entityType" = 'musician';
    END IF;

    -- Update project sequence
    IF EXISTS (SELECT 1 FROM "Project" LIMIT 1) THEN
        UPDATE "IdSequence" SET "lastNumber" = (
            SELECT COALESCE(MAX(
                CAST(SUBSTRING("projectId" FROM '[0-9]+') AS INTEGER)
            ), 0)
            FROM "Project"
            WHERE "projectId" ~ '^PROJ[0-9]+$'
        ) WHERE "entityType" = 'project';
    END IF;

    -- Update instrument sequence
    IF EXISTS (SELECT 1 FROM "Instrument" LIMIT 1) THEN
        UPDATE "IdSequence" SET "lastNumber" = (
            SELECT COALESCE(MAX(
                CAST(SUBSTRING("instrumentId" FROM '[0-9]+') AS INTEGER)
            ), 0)
            FROM "Instrument"
            WHERE "instrumentId" ~ '^INST[0-9]+$'
        ) WHERE "entityType" = 'instrument';
    END IF;

    -- Update position sequence
    IF EXISTS (SELECT 1 FROM "Position" LIMIT 1) THEN
        UPDATE "IdSequence" SET "lastNumber" = (
            SELECT COALESCE(MAX(
                CAST(SUBSTRING("positionId" FROM '[0-9]+') AS INTEGER)
            ), 0)
            FROM "Position"
            WHERE "positionId" ~ '^POS[0-9]+$'
        ) WHERE "entityType" = 'position';
    END IF;
END $$;

-- Step 8: Show current state of IdSequence table
SELECT * FROM "IdSequence" ORDER BY "entityType";