-- Manual migration to add requireLocalResidence field to ProjectNeed table
-- Run this in Supabase SQL Editor

-- Add requireLocalResidence column to ProjectNeed table
ALTER TABLE "ProjectNeed" 
ADD COLUMN IF NOT EXISTS "requireLocalResidence" BOOLEAN NOT NULL DEFAULT false;