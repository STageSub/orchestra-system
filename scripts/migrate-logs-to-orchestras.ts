import { neonPrisma } from '@/lib/prisma-dynamic'
import { getPrismaClient } from '@/lib/database-config'
import { config } from '@/lib/database-config'

async function migrateLogs() {
  console.log('=== Migrating SystemLogs from Central to Orchestra Databases ===\n')

  try {
    // 1. Get all logs from Neon (central) database
    console.log('1. Fetching logs from central database...')
    const centralLogs = await neonPrisma.systemLog.findMany({
      orderBy: { timestamp: 'asc' }
    })
    console.log(`   Found ${centralLogs.length} logs in central database`)

    // 2. Group logs by subdomain
    const logsBySubdomain = new Map<string, any[]>()
    
    centralLogs.forEach(log => {
      const subdomain = log.subdomain || 'unknown'
      if (!logsBySubdomain.has(subdomain)) {
        logsBySubdomain.set(subdomain, [])
      }
      logsBySubdomain.get(subdomain)!.push(log)
    })

    console.log('\n2. Logs grouped by subdomain:')
    logsBySubdomain.forEach((logs, subdomain) => {
      console.log(`   ${subdomain}: ${logs.length} logs`)
    })

    // 3. Migrate logs to each orchestra database
    console.log('\n3. Migrating logs to orchestra databases...')
    
    for (const orchestra of config.orchestras) {
      const orchestraLogs = logsBySubdomain.get(orchestra.subdomain) || []
      
      if (orchestraLogs.length === 0) {
        console.log(`   ${orchestra.name}: No logs to migrate`)
        continue
      }

      try {
        const orchestraPrisma = await getPrismaClient(orchestra.subdomain)
        
        // Check if SystemLog table exists
        try {
          await orchestraPrisma.$queryRaw`SELECT 1 FROM "SystemLog" LIMIT 1`
        } catch (error) {
          console.log(`   ${orchestra.name}: SystemLog table doesn't exist yet. Run the migration first.`)
          continue
        }

        // Insert logs in batches
        const batchSize = 100
        for (let i = 0; i < orchestraLogs.length; i += batchSize) {
          const batch = orchestraLogs.slice(i, i + batchSize)
          await orchestraPrisma.systemLog.createMany({
            data: batch.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              level: log.level,
              category: log.category,
              message: log.message,
              metadata: log.metadata,
              userId: log.userId,
              orchestraId: log.orchestraId,
              subdomain: log.subdomain,
              ip: log.ip,
              userAgent: log.userAgent,
              requestId: log.requestId,
              duration: log.duration
            }))
          })
        }
        
        console.log(`   ${orchestra.name}: Migrated ${orchestraLogs.length} logs`)
      } catch (error) {
        console.error(`   ${orchestra.name}: Error migrating logs:`, error)
      }
    }

    // 4. Handle logs without subdomain (superadmin logs)
    const unknownLogs = logsBySubdomain.get('unknown') || []
    if (unknownLogs.length > 0) {
      console.log(`\n4. Keeping ${unknownLogs.length} superadmin/system logs in central database`)
    }

    console.log('\n5. Migration complete!')
    console.log('   Next steps:')
    console.log('   - Verify logs are showing correctly in each orchestra')
    console.log('   - Consider deleting orchestra-specific logs from central database')
    console.log('   - Update monitoring to check orchestra databases')

  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

// Run the migration
migrateLogs()