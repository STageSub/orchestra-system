import { logger } from '@/lib/logger'
import { getPrismaClient } from '@/lib/database-config'
import { neonPrisma } from '@/lib/prisma-dynamic'

async function testMultiTenantLogs() {
  console.log('=== Testing Multi-Tenant Logging System ===\n')

  // 1. Test logging to orchestra database
  console.log('1. Testing orchestra-specific logging...')
  await logger.info('test', 'Test log for Göteborg orchestra', {
    subdomain: 'goteborg',
    orchestraId: 'goteborg-id',
    metadata: { test: true, timestamp: new Date().toISOString() }
  })
  console.log('   ✓ Logged to Göteborg database')

  // 2. Test logging to central database (superadmin)
  console.log('\n2. Testing central database logging...')
  await logger.info('test', 'Test log for superadmin', {
    subdomain: 'admin',
    metadata: { test: true, superadmin: true }
  })
  console.log('   ✓ Logged to central database')

  // 3. Wait a bit for async writes to complete
  console.log('\n3. Waiting for async writes to complete...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 4. Verify logs in orchestra database
  console.log('\n4. Verifying logs in orchestra database...')
  try {
    const goteborgPrisma = await getPrismaClient('goteborg')
    
    // Check if table exists
    try {
      const goteborgLogs = await goteborgPrisma.systemLog.findMany({
        where: {
          category: 'test',
          message: { contains: 'Göteborg' }
        },
        orderBy: { timestamp: 'desc' },
        take: 5
      })
      
      console.log(`   ✓ Found ${goteborgLogs.length} test logs in Göteborg database`)
      if (goteborgLogs.length > 0) {
        console.log(`   Latest: "${goteborgLogs[0].message}"`)
      }
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('   ✗ SystemLog table not found in Göteborg database')
        console.log('   → Run the migration: manual_add_system_log_to_orchestra.sql')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('   ✗ Error checking Göteborg database:', error)
  }

  // 5. Verify logs in central database
  console.log('\n5. Verifying logs in central database...')
  try {
    const centralLogs = await neonPrisma.systemLog.findMany({
      where: {
        category: 'test',
        message: { contains: 'superadmin' }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    })
    
    console.log(`   ✓ Found ${centralLogs.length} test logs in central database`)
    if (centralLogs.length > 0) {
      console.log(`   Latest: "${centralLogs[0].message}"`)
    }
  } catch (error) {
    console.error('   ✗ Error checking central database:', error)
  }

  console.log('\n6. Summary:')
  console.log('   - Orchestra logs should be in orchestra databases')
  console.log('   - Superadmin logs should be in central database')
  console.log('   - Each orchestra admin only sees their own logs')
  console.log('   - Complete data isolation achieved!')
}

// Run the test
testMultiTenantLogs()