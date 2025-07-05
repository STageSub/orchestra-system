-- Add subscription fields to Orchestra table
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS "maxMusicians" INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS "maxProjects" INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS "pricePerMonth" INTEGER DEFAULT 4990;

-- Update existing orchestras with default values
UPDATE "Orchestra" 
SET 
  "plan" = 'medium',
  "maxMusicians" = 200,
  "maxProjects" = 20,
  "pricePerMonth" = 4990
WHERE "plan" IS NULL;