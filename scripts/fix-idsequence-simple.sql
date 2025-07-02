-- Simple fix for IdSequence table - removes tenantId and preserves data

-- Step 1: Remove the compound constraint if it exists
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_tenantId_key";

-- Step 2: Create temporary backup of current data
CREATE TEMP TABLE temp_idsequence AS
SELECT DISTINCT ON ("entityType") 
    "id",
    "entityType",
    "lastNumber",
    "updatedAt"
FROM "IdSequence"
ORDER BY "entityType", "lastNumber" DESC;

-- Step 3: Delete all rows from IdSequence
DELETE FROM "IdSequence";

-- Step 4: Remove tenantId column
ALTER TABLE "IdSequence" DROP COLUMN IF EXISTS "tenantId";

-- Step 5: Insert data back
INSERT INTO "IdSequence" ("id", "entityType", "lastNumber", "updatedAt")
SELECT "id", "entityType", "lastNumber", "updatedAt"
FROM temp_idsequence;

-- Step 6: Drop temporary table
DROP TABLE temp_idsequence;

-- Step 7: Remove tenantId from all other tables
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

-- Step 8: Drop tenant-related tables
DROP TABLE IF EXISTS "UserInvitation" CASCADE;
DROP TABLE IF EXISTS "TenantSubscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- Step 9: Show the result
SELECT * FROM "IdSequence" ORDER BY "entityType";