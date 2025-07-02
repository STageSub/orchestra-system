-- Fix IdSequence table by removing tenantId and fixing constraints

-- Step 1: Create a temporary table with the correct structure
CREATE TEMP TABLE temp_idsequence AS
SELECT DISTINCT ON (entityType) 
    entityType,
    lastNumber,
    updatedAt
FROM "IdSequence"
ORDER BY entityType, lastNumber DESC;

-- Step 2: Drop all constraints on IdSequence
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_key";
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_tenantId_key";
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_pkey";

-- Step 3: Truncate the original table
TRUNCATE TABLE "IdSequence";

-- Step 4: Remove the tenantId column
ALTER TABLE "IdSequence" DROP COLUMN IF EXISTS "tenantId";

-- Step 5: Re-add the primary key
ALTER TABLE "IdSequence" ADD PRIMARY KEY (id);

-- Step 6: Add the simple unique constraint on entityType
ALTER TABLE "IdSequence" ADD CONSTRAINT "IdSequence_entityType_key" UNIQUE ("entityType");

-- Step 7: Insert the data back without tenantId
INSERT INTO "IdSequence" (entityType, lastNumber, updatedAt)
SELECT entityType, lastNumber, updatedAt
FROM temp_idsequence;

-- Step 8: Drop the temporary table
DROP TABLE temp_idsequence;

-- Step 9: Remove tenantId from other tables
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

-- Step 10: Drop tenant-related tables
DROP TABLE IF EXISTS "UserInvitation" CASCADE;
DROP TABLE IF EXISTS "TenantSubscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Step 11: Show the fixed IdSequence table
SELECT * FROM "IdSequence" ORDER BY "entityType";