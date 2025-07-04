-- Migration script for Custom Ranking Lists feature
-- Run this on production databases to enable custom lists

-- Create CustomRankingList table
CREATE TABLE IF NOT EXISTS "CustomRankingList" (
    "id" SERIAL PRIMARY KEY,
    "customListId" TEXT NOT NULL UNIQUE,
    "projectId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "CustomRankingList_projectId_fkey" 
        FOREIGN KEY ("projectId") 
        REFERENCES "Project"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT "CustomRankingList_positionId_fkey" 
        FOREIGN KEY ("positionId") 
        REFERENCES "Position"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create CustomRanking table (junction table)
CREATE TABLE IF NOT EXISTS "CustomRanking" (
    "id" SERIAL PRIMARY KEY,
    "customListId" INTEGER NOT NULL,
    "musicianId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "CustomRanking_customListId_fkey" 
        FOREIGN KEY ("customListId") 
        REFERENCES "CustomRankingList"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT "CustomRanking_musicianId_fkey" 
        FOREIGN KEY ("musicianId") 
        REFERENCES "Musician"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint to prevent duplicate musicians in same list
    CONSTRAINT "CustomRanking_customListId_musicianId_key" 
        UNIQUE ("customListId", "musicianId")
);

-- Add customRankingListId to ProjectNeed if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ProjectNeed' 
        AND column_name = 'customRankingListId'
    ) THEN
        ALTER TABLE "ProjectNeed" 
        ADD COLUMN "customRankingListId" INTEGER,
        ADD CONSTRAINT "ProjectNeed_customRankingListId_fkey" 
            FOREIGN KEY ("customRankingListId") 
            REFERENCES "CustomRankingList"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "CustomRankingList_projectId_idx" ON "CustomRankingList"("projectId");
CREATE INDEX IF NOT EXISTS "CustomRankingList_positionId_idx" ON "CustomRankingList"("positionId");
CREATE INDEX IF NOT EXISTS "CustomRanking_customListId_idx" ON "CustomRanking"("customListId");
CREATE INDEX IF NOT EXISTS "CustomRanking_musicianId_idx" ON "CustomRanking"("musicianId");
CREATE INDEX IF NOT EXISTS "ProjectNeed_customRankingListId_idx" ON "ProjectNeed"("customRankingListId");

-- Verify tables were created
SELECT 
    'CustomRankingList' as table_name, 
    COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'CustomRankingList'
UNION ALL
SELECT 
    'CustomRanking' as table_name, 
    COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'CustomRanking';