-- Manual migration to add notes field to Musician table
-- Run this in Supabase SQL Editor if automatic migration fails

-- Add notes column to Musician table
ALTER TABLE "Musician" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- The column is nullable by default, which is what we want