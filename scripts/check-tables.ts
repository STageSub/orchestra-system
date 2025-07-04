import { neonPrisma } from '@/lib/prisma-dynamic'
import { PrismaClient } from '@prisma/client'

async function checkTable(prisma: any, tableName: string) {
  try {
    switch(tableName) {
      case 'SystemLog':
        await prisma.systemLog.findFirst()
        break
      case 'CustomRankingList':
        await prisma.customRankingList.findFirst()
        break
      case 'CustomRanking':
        await prisma.customRanking.findFirst()
        break
      case 'GroupEmailLog':
        await prisma.groupEmailLog.findFirst()
        break
      case 'ProjectNeed':
        const need = await prisma.projectNeed.findFirst()
        // Check if requireLocalResidence exists
        if (need && 'requireLocalResidence' in need) {
          console.log(`  ✓ ${tableName} (with requireLocalResidence column)`)
        } else {
          console.log(`  ✓ ${tableName} (WITHOUT requireLocalResidence column)`)
        }
        return true
      default:
        return false
    }
    console.log(`  ✓ ${tableName}`)
    return true
  } catch (error: any) {
    if (error.message?.includes('does not exist') || 
        error.message?.includes('relation') ||
        error.code === 'P2021' ||
        error.code === '42P01') {
      console.log(`  ✗ ${tableName} - Table does not exist`)
    } else {
      console.log(`  ✗ ${tableName} - Error: ${error.message}`)
    }
    return false
  }
}

async function checkDatabase() {
  console.log('=== Checking Database Tables ===\n')

  // Check Neon database (for SystemLog)
  console.log('1. Neon Database (Main - for SystemLog):')
  await checkTable(neonPrisma, 'SystemLog')
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

  await checkTable(supabasePrisma, 'CustomRankingList')
  await checkTable(supabasePrisma, 'CustomRanking')
  await checkTable(supabasePrisma, 'GroupEmailLog')
  await checkTable(supabasePrisma, 'ProjectNeed')
  
  await supabasePrisma.$disconnect()
  await neonPrisma.$disconnect()
}

// Run the check
checkDatabase().catch(console.error)