import { prisma } from '@/lib/prisma'

async function fixDatabaseIsolation() {
  console.log('🔧 Fixing database isolation issues...\n')
  
  try {
    // Get all orchestras
    const orchestras = await prisma.orchestra.findMany({
      orderBy: { createdAt: 'asc' } // Keep the oldest assignment
    })
    
    // Group by database URL
    const databaseMap = new Map<string, typeof orchestras>()
    
    for (const orch of orchestras) {
      if (orch.databaseUrl) {
        const dbUrl = orch.databaseUrl
        if (!databaseMap.has(dbUrl)) {
          databaseMap.set(dbUrl, [])
        }
        databaseMap.get(dbUrl)!.push(orch)
      }
    }
    
    // Find and fix duplicates
    const fixes: Array<{ orchestra: string; action: string }> = []
    
    for (const [dbUrl, orchList] of databaseMap) {
      if (orchList.length > 1) {
        console.log(`\n❌ Found ${orchList.length} orchestras sharing database:`)
        console.log(`   Database: ${dbUrl.substring(0, 50)}...`)
        
        // Keep the first (oldest) orchestra, clear others
        const [keep, ...toClear] = orchList
        console.log(`   ✅ Keeping: ${keep.name} (${keep.subdomain})`)
        
        for (const orch of toClear) {
          console.log(`   🔧 Clearing: ${orch.name} (${orch.subdomain})`)
          
          // Clear the database URL for duplicate assignments
          await prisma.orchestra.update({
            where: { id: orch.id },
            data: {
              databaseUrl: null,
              status: 'pending' // Mark as pending since it needs a new database
            }
          })
          
          fixes.push({
            orchestra: `${orch.name} (${orch.subdomain})`,
            action: 'Cleared database URL, set status to pending'
          })
        }
      }
    }
    
    // Report results
    console.log('\n\n📊 Summary:')
    console.log('===========')
    console.log(`Total orchestras: ${orchestras.length}`)
    console.log(`Duplicate database assignments fixed: ${fixes.length}`)
    
    if (fixes.length > 0) {
      console.log('\n📝 Actions taken:')
      fixes.forEach(fix => {
        console.log(`   - ${fix.orchestra}: ${fix.action}`)
      })
      
      console.log('\n⚠️  These orchestras now need new databases assigned!')
      console.log('   Use the superadmin panel to provision new databases.')
    } else {
      console.log('\n✅ No database isolation issues found!')
    }
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this is the main file
if (require.main === module) {
  fixDatabaseIsolation()
}

export { fixDatabaseIsolation }