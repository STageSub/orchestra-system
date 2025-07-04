import { neonPrisma } from '@/lib/prisma-dynamic'
import { PrismaClient } from '@prisma/client'

async function checkColumns(prisma: any, tableName: string, columnName: string) {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND column_name = ${columnName}
    `
    
    if (Array.isArray(result) && result.length > 0) {
      const column = result[0] as any
      console.log(`  ✓ ${tableName}.${columnName} exists (${column.data_type}, nullable: ${column.is_nullable}, default: ${column.column_default || 'none'})`)
      return true
    } else {
      console.log(`  ✗ ${tableName}.${columnName} does not exist`)
      return false
    }
  } catch (error: any) {
    console.log(`  ✗ Error checking ${tableName}.${columnName}: ${error.message}`)
    return false
  }
}

async function checkDatabase() {
  console.log('=== Checking Database Columns ===\n')

  // Check Neon database
  console.log('1. Neon Database (SystemLog):')
  await checkColumns(neonPrisma, 'SystemLog', 'id')
  console.log()

  // Check Supabase database
  console.log('2. Supabase Database (Production):')
  const supabasePrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.GOTEBORG_DATABASE_URL || process.env.SUPABASE_URL || process.env.DATABASE_URL
      }
    }
  })

  // Check critical columns
  await checkColumns(supabasePrisma, 'ProjectNeed', 'requireLocalResidence')
  await checkColumns(supabasePrisma, 'CustomRankingList', 'id')
  await checkColumns(supabasePrisma, 'CustomRanking', 'id')
  await checkColumns(supabasePrisma, 'GroupEmailLog', 'id')
  
  await supabasePrisma.$disconnect()
  await neonPrisma.$disconnect()
}

// Run the check
checkDatabase().catch(console.error)