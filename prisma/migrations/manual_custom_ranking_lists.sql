-- Create CustomRankingList table
CREATE TABLE "CustomRankingList" (
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

-- Create CustomRanking table
CREATE TABLE "CustomRanking" (
    "id" SERIAL NOT NULL,
    "customListId" INTEGER NOT NULL,
    "musicianId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomRanking_pkey" PRIMARY KEY ("id")
);

-- Add new columns to ProjectNeed table
ALTER TABLE "ProjectNeed" 
ADD COLUMN "customRankingListId" INTEGER,
ALTER COLUMN "rankingListId" DROP NOT NULL;

-- Create unique constraints
ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_customListId_key" UNIQUE ("customListId");
ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_customListId_musicianId_key" UNIQUE ("customListId", "musicianId");
ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_customListId_rank_key" UNIQUE ("customListId", "rank");

-- Create indexes
CREATE INDEX "CustomRankingList_projectId_idx" ON "CustomRankingList"("projectId");
CREATE INDEX "CustomRankingList_positionId_idx" ON "CustomRankingList"("positionId");
CREATE INDEX "CustomRankingList_isTemplate_idx" ON "CustomRankingList"("isTemplate");
CREATE INDEX "CustomRanking_customListId_idx" ON "CustomRanking"("customListId");

-- Add foreign keys
ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRankingList" ADD CONSTRAINT "CustomRankingList_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_customListId_fkey" FOREIGN KEY ("customListId") REFERENCES "CustomRankingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRanking" ADD CONSTRAINT "CustomRanking_musicianId_fkey" FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectNeed" ADD CONSTRAINT "ProjectNeed_customRankingListId_fkey" FOREIGN KEY ("customRankingListId") REFERENCES "CustomRankingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;