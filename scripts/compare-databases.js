const { PrismaClient } = require('@prisma/client')

async function compareDatabases() {
  // Database URLs
  const scoDatabaseUrl = process.env.DATABASE_URL_SCO || 'postgresql://postgres.tckcuexsdzovsqaqiqkr:Kurdistan12@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  // SCOSO URL has special characters that are already URL-encoded
  const scosoDatabaseUrl = process.env.DATABASE_URL_SCOSO || 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const scoPrisma = new PrismaClient({
    datasources: {
      db: {
        url: scoDatabaseUrl
      }
    }
  })

  const scosoPrisma = new PrismaClient({
    datasources: {
      db: {
        url: scosoDatabaseUrl
      }
    }
  })

  try {
    console.log('🔍 Comparing SCO and SCOSO databases...\n')
    
    // Get tables from SCO
    console.log('📊 Getting tables from SCO database...')
    const scoTables = await scoPrisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    
    // Get tables from SCOSO
    console.log('📊 Getting tables from SCOSO database...')
    const scosoTables = await scosoPrisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    
    // Convert to Sets for easy comparison
    const scoTableNames = new Set(scoTables.map(t => t.tablename))
    const scosoTableNames = new Set(scosoTables.map(t => t.tablename))
    
    // Find differences
    const missingInScoso = [...scoTableNames].filter(t => !scosoTableNames.has(t))
    const extraInScoso = [...scosoTableNames].filter(t => !scoTableNames.has(t))
    
    console.log('\n📝 RESULTS:')
    console.log('============')
    
    console.log(`\nSCO has ${scoTableNames.size} tables`)
    console.log(`SCOSO has ${scosoTableNames.size} tables`)
    
    if (missingInScoso.length > 0) {
      console.log('\n❌ Tables missing in SCOSO:')
      missingInScoso.forEach(table => console.log(`   - ${table}`))
    } else {
      console.log('\n✅ SCOSO has all tables that SCO has')
    }
    
    if (extraInScoso.length > 0) {
      console.log('\n⚠️  Extra tables in SCOSO (not in SCO):')
      extraInScoso.forEach(table => console.log(`   - ${table}`))
    }
    
    // Check specific important tables
    console.log('\n🔎 Checking specific important tables:')
    const importantTables = ['IdSequence', 'Musician', 'Project', 'Instrument', 'Position']
    
    for (const table of importantTables) {
      const scoHas = scoTableNames.has(table)
      const scosoHas = scosoTableNames.has(table)
      console.log(`   ${table}: SCO ${scoHas ? '✅' : '❌'} | SCOSO ${scosoHas ? '✅' : '❌'}`)
    }
    
    // Check column differences for common tables
    const commonTables = [...scoTableNames].filter(t => scosoTableNames.has(t))
    console.log(`\n🔍 Checking column differences for ${commonTables.length} common tables...`)
    
    let columnDifferences = []
    
    for (const table of commonTables) {
      const scoColumns = await scoPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `
      
      const scosoColumns = await scosoPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `
      
      const scoColNames = new Set(scoColumns.map(c => c.column_name))
      const scosoColNames = new Set(scosoColumns.map(c => c.column_name))
      
      const missingCols = [...scoColNames].filter(c => !scosoColNames.has(c))
      const extraCols = [...scosoColNames].filter(c => !scoColNames.has(c))
      
      if (missingCols.length > 0 || extraCols.length > 0) {
        columnDifferences.push({
          table,
          missingInScoso: missingCols,
          extraInScoso: extraCols
        })
      }
    }
    
    if (columnDifferences.length > 0) {
      console.log('\n⚠️  Tables with column differences:')
      columnDifferences.forEach(diff => {
        console.log(`\n   Table: ${diff.table}`)
        if (diff.missingInScoso.length > 0) {
          console.log(`   Missing columns in SCOSO: ${diff.missingInScoso.join(', ')}`)
        }
        if (diff.extraInScoso.length > 0) {
          console.log(`   Extra columns in SCOSO: ${diff.extraInScoso.join(', ')}`)
        }
      })
    } else {
      console.log('\n✅ All common tables have the same columns')
    }
    
  } catch (error) {
    console.error('❌ Error comparing databases:', error)
    throw error
  } finally {
    await scoPrisma.$disconnect()
    await scosoPrisma.$disconnect()
  }
}

// Run the comparison
compareDatabases()
  .then(() => {
    console.log('\n✅ Database comparison completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Database comparison failed:', error)
    process.exit(1)
  })