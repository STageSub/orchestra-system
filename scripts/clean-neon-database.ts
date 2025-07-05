import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanNeonDatabase() {
  console.log('🧹 Cleaning Neon database - removing orchestra-specific tables...')
  
  const tablesToDrop = [
    'CustomRanking',
    'CustomRankingList',
    'RequestToken',
    'CommunicationLog',
    'Request',
    'ProjectFile',
    'ProjectNeed',
    'GroupEmailLog',
    'FileStorage',
    'Project',
    'Ranking',
    'RankingList',
    'MusicianQualification',
    'Position',
    'Instrument',
    'Musician',
    'EmailTemplate',
    'AuditLog',
    'IdSequence',
    'DeletedIds',
    'Settings'
  ]
  
  try {
    // Drop each table
    for (const table of tablesToDrop) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`)
        console.log(`✅ Dropped table: ${table}`)
      } catch (error) {
        console.log(`⚠️  Error dropping ${table}:`, error)
      }
    }
    
    // Check remaining tables
    const remainingTables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log('\n📊 Remaining tables in Neon:')
    for (const row of remainingTables) {
      console.log(`  - ${row.table_name}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanNeonDatabase()