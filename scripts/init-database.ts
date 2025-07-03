import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

async function initDatabase() {
  const databaseUrl = process.argv[2]
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL krävs')
    console.error('Användning: npx tsx scripts/init-database.ts "postgresql://..."')
    process.exit(1)
  }

  console.log('🚀 Initierar ny databas...')
  console.log(`📊 Database URL: ${databaseUrl.substring(0, 50)}...`)

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'init-database.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`⏳ Kör ${statements.length} SQL-kommandon...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip DO blocks as they need special handling
      if (statement.includes('DO $$')) {
        const doBlock = sql.substring(sql.indexOf('DO $$'), sql.indexOf('END $$;') + 7)
        await prisma.$executeRawUnsafe(doBlock)
        console.log(`✓ Körde DO block`)
        break
      }
      
      try {
        await prisma.$executeRawUnsafe(statement)
        console.log(`✓ Kommando ${i + 1}/${statements.length} slutfört`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error(`✗ Kommando ${i + 1} misslyckades:`, error.message)
          throw error
        }
      }
    }

    console.log('✅ Alla tabeller skapade!')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel vid databas-initiering:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

initDatabase()