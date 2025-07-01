-- Add Multi-Tenant Schema
-- This migration adds Tenant and User tables and updates all existing tables with tenantId

-- 1. Create Tenant table
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "subscription" TEXT NOT NULL DEFAULT 'trial',
    "maxMusicians" INTEGER NOT NULL DEFAULT 50,
    "maxActiveProjects" INTEGER NOT NULL DEFAULT 5,
    "maxInstruments" INTEGER NOT NULL DEFAULT 10,
    "databaseType" TEXT NOT NULL DEFAULT 'shared',
    "databaseUrl" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Create unique index on subdomain
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- 2. Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "tenantId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- Add foreign key for User -> Tenant
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create a default tenant for existing data
INSERT INTO "Tenant" (
    "id",
    "name",
    "subdomain",
    "subscription",
    "maxMusicians",
    "maxActiveProjects",
    "maxInstruments",
    "updatedAt"
) VALUES (
    'default-tenant',
    'Default Orchestra',
    'default',
    'institution',
    999999,
    999999,
    999999,
    CURRENT_TIMESTAMP
);

-- 4. Add tenantId to all existing tables
ALTER TABLE "Musician" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Instrument" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Position" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RankingList" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Project" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "EmailTemplate" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "IdSequence" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DeletedIds" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Settings" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "GroupEmailLog" ADD COLUMN "tenantId" TEXT;

-- 5. Set default tenant for all existing records
UPDATE "Musician" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Instrument" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Position" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "RankingList" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Project" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "EmailTemplate" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "AuditLog" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "IdSequence" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "DeletedIds" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Settings" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "GroupEmailLog" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;

-- 6. Make tenantId NOT NULL after setting defaults
ALTER TABLE "Musician" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Instrument" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Position" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RankingList" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "EmailTemplate" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "IdSequence" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DeletedIds" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Settings" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "GroupEmailLog" ALTER COLUMN "tenantId" SET NOT NULL;

-- 7. Add foreign key constraints
ALTER TABLE "Musician" ADD CONSTRAINT "Musician_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Position" ADD CONSTRAINT "Position_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RankingList" ADD CONSTRAINT "RankingList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdSequence" ADD CONSTRAINT "IdSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeletedIds" ADD CONSTRAINT "DeletedIds_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupEmailLog" ADD CONSTRAINT "GroupEmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Create indexes for better query performance
CREATE INDEX "Musician_tenantId_idx" ON "Musician"("tenantId");
CREATE INDEX "Instrument_tenantId_idx" ON "Instrument"("tenantId");
CREATE INDEX "Position_tenantId_idx" ON "Position"("tenantId");
CREATE INDEX "RankingList_tenantId_idx" ON "RankingList"("tenantId");
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");
CREATE INDEX "EmailTemplate_tenantId_idx" ON "EmailTemplate"("tenantId");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "IdSequence_tenantId_idx" ON "IdSequence"("tenantId");
CREATE INDEX "DeletedIds_tenantId_idx" ON "DeletedIds"("tenantId");
CREATE INDEX "Settings_tenantId_idx" ON "Settings"("tenantId");
CREATE INDEX "GroupEmailLog_tenantId_idx" ON "GroupEmailLog"("tenantId");

-- 9. Update unique constraints to include tenantId
-- Drop existing unique constraints first
ALTER TABLE "Musician" DROP CONSTRAINT IF EXISTS "Musician_email_key";
ALTER TABLE "Instrument" DROP CONSTRAINT IF EXISTS "Instrument_name_key";
ALTER TABLE "EmailTemplate" DROP CONSTRAINT IF EXISTS "EmailTemplate_type_key";
ALTER TABLE "IdSequence" DROP CONSTRAINT IF EXISTS "IdSequence_entityType_key";
ALTER TABLE "DeletedIds" DROP CONSTRAINT IF EXISTS "DeletedIds_entityType_deletedId_key";
ALTER TABLE "Settings" DROP CONSTRAINT IF EXISTS "Settings_key_key";

-- Create new unique constraints with tenantId
CREATE UNIQUE INDEX "Musician_email_tenantId_key" ON "Musician"("email", "tenantId");
CREATE UNIQUE INDEX "Instrument_name_tenantId_key" ON "Instrument"("name", "tenantId");
CREATE UNIQUE INDEX "EmailTemplate_type_tenantId_key" ON "EmailTemplate"("type", "tenantId");
CREATE UNIQUE INDEX "IdSequence_entityType_tenantId_key" ON "IdSequence"("entityType", "tenantId");
CREATE UNIQUE INDEX "DeletedIds_entityType_deletedId_tenantId_key" ON "DeletedIds"("entityType", "deletedId", "tenantId");
CREATE UNIQUE INDEX "Settings_key_tenantId_key" ON "Settings"("key", "tenantId");

-- 10. Create a default admin user for the default tenant
INSERT INTO "User" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "tenantId",
    "updatedAt"
) VALUES (
    'default-admin',
    'admin@default.orchestra',
    '$2a$10$K7L1OJ0/NBkm7I0V0M0M0.JjL0J0J0J0J0J0J0J0J0J0J0J0J0J0J', -- password: 'admin123'
    'Default Admin',
    'admin',
    'default-tenant',
    CURRENT_TIMESTAMP
);