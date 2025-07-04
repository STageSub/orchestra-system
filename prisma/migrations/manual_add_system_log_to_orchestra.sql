-- Add SystemLog table to each orchestra database
-- This ensures logs are stored in the orchestra's own database for data isolation

-- Drop the table if it exists (in case it was accidentally created before)
DROP TABLE IF EXISTS "SystemLog";

-- Create SystemLog table
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "orchestraId" TEXT,
    "subdomain" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "duration" INTEGER,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "SystemLog_timestamp_idx" ON "SystemLog"("timestamp");
CREATE INDEX "SystemLog_category_idx" ON "SystemLog"("category");
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");

-- Note: orchestraId index not needed since each database only contains its own orchestra's logs