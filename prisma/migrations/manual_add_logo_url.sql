-- Add logoUrl column to Orchestra table
ALTER TABLE "Orchestra" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Update for existing orchestras (optional - can set default logos later)
-- UPDATE "Orchestra" SET "logoUrl" = NULL WHERE "logoUrl" IS NULL;