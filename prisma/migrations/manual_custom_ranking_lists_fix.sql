-- Create CustomRankingList table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CustomRankingList" (
    "id" SERIAL NOT NULL,
    "customListId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRankingList_pkey" PRIMARY KEY ("id")
);

-- Create CustomRanking table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CustomRanking" (
    "id" SERIAL NOT NULL,
    "customListId" INTEGER NOT NULL,
    "musicianId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRanking_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRankingList_customListId_key') THEN
        ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_customListId_key" UNIQUE ("customListId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRanking_customListId_musicianId_key') THEN
        ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_customListId_musicianId_key" UNIQUE ("customListId", "musicianId");
    END IF;
END $$;

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRankingList_projectId_fkey') THEN
        ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRankingList_positionId_fkey') THEN
        ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRanking_customListId_fkey') THEN
        ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_customListId_fkey" FOREIGN KEY ("customListId") REFERENCES "CustomRankingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRanking_musicianId_fkey') THEN
        ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add customRankingListId column to ProjectNeed if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProjectNeed' AND column_name = 'customRankingListId') THEN
        ALTER TABLE "ProjectNeed" ADD COLUMN "customRankingListId" INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE "ProjectNeed" ADD CONSTRAINT "ProjectNeed_customRankingListId_fkey" FOREIGN KEY ("customRankingListId") REFERENCES "CustomRankingList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "CustomRankingList_projectId_idx" ON "CustomRankingList"("projectId");
CREATE INDEX IF NOT EXISTS "CustomRankingList_positionId_idx" ON "CustomRankingList"("positionId");
CREATE INDEX IF NOT EXISTS "CustomRanking_customListId_idx" ON "CustomRanking"("customListId");
CREATE INDEX IF NOT EXISTS "CustomRanking_musicianId_idx" ON "CustomRanking"("musicianId");
CREATE INDEX IF NOT EXISTS "ProjectNeed_customRankingListId_idx" ON "ProjectNeed"("customRankingListId");