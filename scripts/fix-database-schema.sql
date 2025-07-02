-- Fix IdSequence table to remove multi-tenant changes
-- This script reverts the IdSequence table to its original schema

-- First, drop the compound unique constraint if it exists
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_tenantId_key";

-- Drop the tenantId column if it exists
ALTER TABLE "IdSequence" DROP COLUMN IF EXISTS "tenantId";

-- Make sure entityType has a unique constraint
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_key";
ALTER TABLE "IdSequence" ADD CONSTRAINT "IdSequence_entityType_key" UNIQUE ("entityType");

-- Remove any tenant-related tables that might exist
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "TenantSubscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;
DROP TABLE IF EXISTS "UserInvitation" CASCADE;

-- Remove tenantId columns from other tables if they exist
ALTER TABLE "Musician" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Instrument" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Settings" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "EmailTemplate" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CommunicationLog" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "RankingList" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "DeletedIds" DROP COLUMN IF EXISTS "tenantId";

-- Ensure IdSequence has all needed entity types
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

-- Update the lastNumber for existing records based on actual data
UPDATE "IdSequence" SET "lastNumber" = (
  SELECT COALESCE(MAX(CAST(SUBSTRING("musicianId" FROM 4) AS INTEGER)), 0)
  FROM "Musician"
) WHERE "entityType" = 'musician';

UPDATE "IdSequence" SET "lastNumber" = (
  SELECT COALESCE(MAX(CAST(SUBSTRING("projectId" FROM 5) AS INTEGER)), 0)
  FROM "Project"
) WHERE "entityType" = 'project';

UPDATE "IdSequence" SET "lastNumber" = (
  SELECT COALESCE(MAX(CAST(SUBSTRING("instrumentId" FROM 5) AS INTEGER)), 0)
  FROM "Instrument"
) WHERE "entityType" = 'instrument';