const { PrismaClient } = require('@prisma/client')

async function checkNeonTables() {
  // Neon database URL (central database)
  const neonDatabaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_1Z3hWOHlFBae@ep-morning-block-a9uuo9dm-pooler.gwc.azure.neon.tech/neondb?sslmode=require'
  
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: neonDatabaseUrl
      }
    }
  })

  try {
    console.log('🔍 Checking tables in Neon database...\n')
    console.log('Database URL:', neonDatabaseUrl.replace(/:([^@]+)@/, ':****@'))
    
    // Get all tables
    const tables = await neonPrisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    
    console.log(`\n📊 Found ${tables.length} tables in Neon database:\n`)
    
    // Define which tables SHOULD be in central (Neon) vs orchestra databases
    const centralTables = ['Orchestra', 'User', 'Customer', 'SystemLog']
    const orchestraTables = [
      'Musician', 'Instrument', 'Position', 'MusicianQualification',
      'RankingList', 'Ranking', 'Project', 'ProjectNeed', 'Request',
      'RequestToken', 'EmailTemplate', 'CommunicationLog', 'ProjectFile',
      'AuditLog', 'IdSequence', 'DeletedIds', 'Settings', 'GroupEmailLog',
      'FileStorage', 'CustomRankingList', 'CustomRanking'
    ]
    
    // Check each table
    const tableNames = tables.map(t => t.tablename)
    
    console.log('✅ Tables that SHOULD be in Neon (central):')
    centralTables.forEach(table => {
      const exists = tableNames.includes(table)
      console.log(`   ${table}: ${exists ? '✅ Present' : '❌ Missing'}`)
    })
    
    console.log('\n❌ Tables that should NOT be in Neon (belong in orchestra DBs):')
    orchestraTables.forEach(table => {
      const exists = tableNames.includes(table)
      if (exists) {
        console.log(`   ${table}: ⚠️  INCORRECTLY in Neon`)
      }
    })
    
    console.log('\n📝 All tables in Neon:')
    tableNames.forEach(table => {
      const isCentral = centralTables.includes(table)
      const isOrchestra = orchestraTables.includes(table)
      let status = ''
      if (isCentral) status = '✅ Correct'
      else if (isOrchestra) status = '❌ Should be in orchestra DB'
      else status = '❓ Unknown'
      
      console.log(`   ${table} - ${status}`)
    })
    
    // Check for data in orchestra tables that shouldn't be there
    console.log('\n🔍 Checking data in tables that shouldn\'t be in Neon:')
    
    for (const table of orchestraTables) {
      if (tableNames.includes(table)) {
        try {
          const count = await neonPrisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${table}"`
          )
          console.log(`   ${table}: ${count[0].count} records`)
        } catch (e) {
          console.log(`   ${table}: Error checking - ${e.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Neon database:', error)
    throw error
  } finally {
    await neonPrisma.$disconnect()
  }
}

// Run the check
checkNeonTables()
  .then(() => {
    console.log('\n✅ Neon database check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Neon database check failed:', error)
    process.exit(1)
  })