-- Ta bort User tabell från SCO-databasen
-- (Den ska bara finnas i huvuddatabasen)
DROP TABLE IF EXISTS "User" CASCADE;

-- Ta bort Orchestra tabell från SCO-databasen  
-- (Den ska bara finnas i huvuddatabasen)
DROP TABLE IF EXISTS "Orchestra" CASCADE;

-- Lista kvarvarande tabeller för verifiering
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN ('_prisma_migrations')
ORDER BY table_name;