import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTables() {
  try {
    const result = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log('Tables in Neon database:')
    console.log('========================')
    
    const centralTables = ['Orchestra', 'User', 'Customer', 'SystemLog']
    const orchestraTables: string[] = []
    
    for (const row of result) {
      const tableName = row.table_name
      if (centralTables.includes(tableName)) {
        console.log(`✅ ${tableName} (should be in central DB)`)
      } else if (tableName === '_prisma_migrations') {
        console.log(`⚙️  ${tableName} (system table)`)
      } else {
        console.log(`❌ ${tableName} (should NOT be in central DB)`)
        orchestraTables.push(tableName)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`- Central tables: ${centralTables.length}`)
    console.log(`- Orchestra tables that should be removed: ${orchestraTables.length}`)
    
    if (orchestraTables.length > 0) {
      console.log('\n⚠️  These tables should only exist in orchestra databases:')
      orchestraTables.forEach(t => console.log(`  - ${t}`))
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()