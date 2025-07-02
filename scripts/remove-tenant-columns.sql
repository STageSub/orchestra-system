-- Simple script to remove all multi-tenant columns and tables
-- This assumes the IdSequence table already has the correct constraints

-- Step 1: Remove tenant-related tables
DROP TABLE IF EXISTS "UserInvitation" CASCADE;
DROP TABLE IF EXISTS "TenantSubscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Step 2: Remove tenantId columns from all tables
ALTER TABLE "IdSequence" DROP COLUMN IF EXISTS "tenantId";
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

-- Step 3: Update sequence numbers based on existing data
-- For musicians
UPDATE "IdSequence" 
SET "lastNumber" = COALESCE((
    SELECT MAX(CAST(SUBSTRING("musicianId" FROM '[0-9]+') AS INTEGER))
    FROM "Musician"
    WHERE "musicianId" ~ '^MUS[0-9]+$'
), "lastNumber")
WHERE "entityType" = 'musician';

-- For projects  
UPDATE "IdSequence"
SET "lastNumber" = COALESCE((
    SELECT MAX(CAST(SUBSTRING("projectId" FROM '[0-9]+') AS INTEGER))
    FROM "Project"
    WHERE "projectId" ~ '^PROJ[0-9]+$'
), "lastNumber")
WHERE "entityType" = 'project';

-- For instruments
UPDATE "IdSequence"
SET "lastNumber" = COALESCE((
    SELECT MAX(CAST(SUBSTRING("instrumentId" FROM '[0-9]+') AS INTEGER))
    FROM "Instrument"
    WHERE "instrumentId" ~ '^INST[0-9]+$'
), "lastNumber")
WHERE "entityType" = 'instrument';

-- Show the updated sequences
SELECT * FROM "IdSequence" ORDER BY "entityType";