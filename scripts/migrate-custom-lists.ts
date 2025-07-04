import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Script to run custom list migration on production databases

async function runMigration() {
  console.log('Starting Custom Ranking Lists migration...')
  
  // Read the SQL migration file
  const sqlPath = path.join(__dirname, 'migrate-custom-lists.sql')
  const migrationSQL = fs.readFileSync(sqlPath, 'utf-8')
  
  // Get all orchestra databases that need migration
  const orchestras = [
    {
      name: 'SCO',
      url: process.env.DATABASE_URL_SCO || process.env.DATABASE_URL
    },
    {
      name: 'SCOSO', 
      url: process.env.DATABASE_URL_SCOSO
    }
  ]
  
  for (const orchestra of orchestras) {
    if (!orchestra.url) {
      console.log(`⏭️  Skipping ${orchestra.name} - no database URL configured`)
      continue
    }
    
    console.log(`\n🎭 Migrating ${orchestra.name}...`)
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: orchestra.url
        }
      }
    })
    
    try {
      // Check if tables already exist
      const tableCheck = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'CustomRankingList'
      ` as any[]
      
      if (tableCheck[0].count > 0) {
        console.log(`✅ ${orchestra.name} already has custom list tables`)
        continue
      }
      
      // Run the migration
      console.log(`📝 Creating tables for ${orchestra.name}...`)
      
      // Split the SQL into individual statements and run them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        try {
          await prisma.$executeRawUnsafe(statement + ';')
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists')) {
            console.error(`Error executing statement: ${error.message}`)
            console.error(`Statement: ${statement.substring(0, 100)}...`)
          }
        }
      }
      
      // Verify tables were created
      const verifyTables = await prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'CustomRankingList') as custom_list_table,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'CustomRanking') as custom_ranking_table,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ProjectNeed' AND column_name = 'customRankingListId') as project_need_column
      ` as any[]
      
      const result = verifyTables[0]
      if (result.custom_list_table > 0 && result.custom_ranking_table > 0 && result.project_need_column > 0) {
        console.log(`✅ ${orchestra.name} migration completed successfully!`)
      } else {
        console.error(`❌ ${orchestra.name} migration may have failed. Tables not found.`)
      }
      
    } catch (error) {
      console.error(`❌ Error migrating ${orchestra.name}:`, error)
    } finally {
      await prisma.$disconnect()
    }
  }
  
  console.log('\n✨ Migration script completed!')
  console.log('\nNext steps:')
  console.log('1. Verify the migration worked by checking the database')
  console.log('2. Test creating custom lists in the application')
  console.log('3. If any orchestra failed, check the error messages above')
}

// Run the migration
runMigration().catch(console.error)