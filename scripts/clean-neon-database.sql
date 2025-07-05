-- Script to remove orchestra-specific tables from Neon (central) database
-- These tables should only exist in orchestra databases

-- Drop tables in correct order to handle foreign key constraints
DROP TABLE IF EXISTS "CustomRanking" CASCADE;
DROP TABLE IF EXISTS "CustomRankingList" CASCADE;
DROP TABLE IF EXISTS "RequestToken" CASCADE;
DROP TABLE IF EXISTS "CommunicationLog" CASCADE;
DROP TABLE IF EXISTS "Request" CASCADE;
DROP TABLE IF EXISTS "ProjectFile" CASCADE;
DROP TABLE IF EXISTS "ProjectNeed" CASCADE;
DROP TABLE IF EXISTS "GroupEmailLog" CASCADE;
DROP TABLE IF EXISTS "FileStorage" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "Ranking" CASCADE;
DROP TABLE IF EXISTS "RankingList" CASCADE;
DROP TABLE IF EXISTS "MusicianQualification" CASCADE;
DROP TABLE IF EXISTS "Position" CASCADE;
DROP TABLE IF EXISTS "Instrument" CASCADE;
DROP TABLE IF EXISTS "Musician" CASCADE;
DROP TABLE IF EXISTS "EmailTemplate" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "IdSequence" CASCADE;
DROP TABLE IF EXISTS "DeletedIds" CASCADE;
DROP TABLE IF EXISTS "Settings" CASCADE;

-- Verify what's left
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;