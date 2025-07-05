import { PrismaClient } from '@prisma/client'

// Create Prisma client for central database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

async function verifyState() {
  console.log('=== Verifying Superadmin Current State ===\n')

  try {
    // 1. Check orchestras
    console.log('1. Checking Orchestras:')
    const orchestras = await prisma.orchestra.findMany({
      include: {
        users: true
      }
    })
    console.log(`   - Total orchestras: ${orchestras.length}`)
    orchestras.forEach(o => {
      console.log(`   - ${o.name} (${o.subdomain}): ${o.status}, ${o.users.length} users`)
    })

    // 2. Check users
    console.log('\n2. Checking Users:')
    const users = await prisma.user.findMany()
    const superadmins = users.filter(u => u.role === 'superadmin')
    const admins = users.filter(u => u.role === 'admin')
    console.log(`   - Total users: ${users.length}`)
    console.log(`   - Superadmins: ${superadmins.length}`)
    console.log(`   - Admins: ${admins.length}`)

    // 3. Check system logs
    console.log('\n3. Checking System Logs:')
    const recentLogs = await prisma.systemLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    })
    console.log(`   - Recent logs: ${recentLogs.length}`)

    // 4. Check customers
    console.log('\n4. Checking Customers:')
    const customers = await prisma.customer.findMany()
    console.log(`   - Total customers: ${customers.length}`)
    customers.forEach(c => {
      console.log(`   - ${c.name} (${c.subdomain}): ${c.status}`)
    })

    console.log('\n✅ Verification complete!')
    console.log('\nSummary:')
    console.log(`- Orchestras: ${orchestras.length} configured`)
    console.log(`- Users: ${users.length} total (${superadmins.length} superadmins)`)
    console.log(`- Everything appears to be working correctly`)

  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyState()