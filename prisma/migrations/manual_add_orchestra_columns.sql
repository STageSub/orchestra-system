-- Add missing columns to Orchestra table in production
-- Run this in Neon dashboard SQL editor

-- Add orchestraId column
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "orchestraId" TEXT UNIQUE;

-- Add other potentially missing columns
ALTER TABLE "Orchestra"
ADD COLUMN IF NOT EXISTS "contactName" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS "maxMusicians" INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS "maxProjects" INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS "pricePerMonth" INTEGER DEFAULT 4990;

-- Update existing orchestras with orchestraId values
UPDATE "Orchestra" 
SET "orchestraId" = CASE 
    WHEN name = 'SCO Admin' THEN 'SCO'
    WHEN name = 'SCOSO Admin' THEN 'SCOSO'
    ELSE UPPER(LEFT(REPLACE(name, ' ', ''), 3))
END
WHERE "orchestraId" IS NULL;

-- Update contact info for existing orchestras
UPDATE "Orchestra"
SET "contactName" = 'Admin',
    "contactEmail" = 'admin@stagesub.com'
WHERE "contactName" IS NULL;

-- Verify the changes
SELECT id, name, "orchestraId", status, plan, "maxMusicians", "maxProjects" 
FROM "Orchestra";