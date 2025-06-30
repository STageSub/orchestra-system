-- Manual migration to add all missing columns
-- Run this in Supabase SQL Editor to fix all missing columns
-- 
-- VIKTIGT: Kör denna SQL i Supabase för att fixa alla saknade kolumner!
-- Detta löser "Failed to fetch rankings data: 500" och andra fel.

-- 1. Add GroupEmailLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "GroupEmailLog" (
    "id" SERIAL PRIMARY KEY,
    "projectId" INTEGER,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "sentCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupEmailLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create index on projectId for performance
CREATE INDEX IF NOT EXISTS "GroupEmailLog_projectId_idx" ON "GroupEmailLog"("projectId");

-- 2. Add requireLocalResidence column to ProjectNeed table
ALTER TABLE "ProjectNeed" 
ADD COLUMN IF NOT EXISTS "requireLocalResidence" BOOLEAN NOT NULL DEFAULT false;

-- 3. Add archive columns to Instrument table
ALTER TABLE "Instrument"
ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- 4. Add originalFileName and mimeType to ProjectFile table (if missing)
ALTER TABLE "ProjectFile"
ADD COLUMN IF NOT EXISTS "originalFileName" TEXT,
ADD COLUMN IF NOT EXISTS "mimeType" TEXT;

-- 5. Verify all tables exist
-- This will show you which tables are missing
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;