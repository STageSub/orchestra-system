-- Manual migration for Supabase
-- Date: 2025-06-30
-- Purpose: Add preferredLanguage field to Musician table for multi-language email support

-- Add the column
ALTER TABLE "Musician" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'sv';

-- Update existing records to have Swedish as default (if any are NULL)
UPDATE "Musician" SET "preferredLanguage" = 'sv' WHERE "preferredLanguage" IS NULL;

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'Musician' 
    AND column_name = 'preferredLanguage';

-- Expected output:
-- column_name       | data_type | is_nullable | column_default
-- preferredLanguage | text      | YES         | 'sv'::text