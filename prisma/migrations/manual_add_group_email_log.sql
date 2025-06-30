-- Manual migration to add GroupEmailLog table
-- Run this in Supabase SQL Editor if automatic migration fails

-- Create GroupEmailLog table if it doesn't exist
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