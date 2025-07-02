-- Diagnostic script to check ID formats in the database

-- Check Musician IDs
SELECT 'Musicians' as table_name, COUNT(*) as total_count,
       COUNT(CASE WHEN "musicianId" ~ '^MUS[0-9]+$' THEN 1 END) as standard_format,
       COUNT(CASE WHEN "musicianId" !~ '^MUS[0-9]+$' THEN 1 END) as non_standard_format
FROM "Musician";

-- Show sample musician IDs
SELECT 'Sample Musician IDs:' as info;
SELECT "musicianId", "firstName", "lastName" 
FROM "Musician" 
LIMIT 10;

-- Check Project IDs
SELECT 'Projects' as table_name, COUNT(*) as total_count,
       COUNT(CASE WHEN "projectId" ~ '^PROJ[0-9]+$' THEN 1 END) as standard_format,
       COUNT(CASE WHEN "projectId" !~ '^PROJ[0-9]+$' THEN 1 END) as non_standard_format
FROM "Project";

-- Show sample project IDs
SELECT 'Sample Project IDs:' as info;
SELECT "projectId", "name" 
FROM "Project" 
LIMIT 10;

-- Check Instrument IDs
SELECT 'Instruments' as table_name, COUNT(*) as total_count,
       COUNT(CASE WHEN "instrumentId" ~ '^INST[0-9]+$' THEN 1 END) as standard_format,
       COUNT(CASE WHEN "instrumentId" !~ '^INST[0-9]+$' THEN 1 END) as non_standard_format
FROM "Instrument";

-- Show sample instrument IDs
SELECT 'Sample Instrument IDs:' as info;
SELECT "instrumentId", "name" 
FROM "Instrument" 
LIMIT 10;

-- Check current IdSequence values
SELECT 'Current IdSequence:' as info;
SELECT * FROM "IdSequence" ORDER BY "entityType";