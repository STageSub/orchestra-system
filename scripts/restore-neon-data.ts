import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function restoreData() {
  console.log('🔄 Starting Neon database restoration...')
  
  try {
    // Read backup data
    const backupPath = join(process.cwd(), 'main-tables-export-1751554354027.json')
    const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'))
    
    console.log(`📊 Found ${backupData.orchestras.length} orchestras and ${backupData.users.length} users to restore`)
    
    // Restore orchestras
    console.log('\n📌 Restoring orchestras...')
    for (const orchestra of backupData.orchestras) {
      const created = await prisma.orchestra.create({
        data: {
          id: orchestra.id,
          orchestraId: orchestra.id,
          name: orchestra.name,
          subdomain: orchestra.subdomain,
          contactName: orchestra.contactName,
          contactEmail: orchestra.contactEmail,
          databaseUrl: orchestra.databaseUrl,
          status: orchestra.status,
          plan: 'medium',
          maxMusicians: 200,
          maxProjects: 20,
          pricePerMonth: 4990,
          createdAt: new Date(orchestra.createdAt),
          updatedAt: new Date(orchestra.updatedAt)
        }
      })
      console.log(`✅ Restored orchestra: ${created.name} (${created.subdomain})`)
    }
    
    // Restore users
    console.log('\n👤 Restoring users...')
    for (const user of backupData.users) {
      const created = await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          orchestraId: user.orchestraId,
          active: user.active,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
      console.log(`✅ Restored user: ${created.username} (${created.role})`)
    }
    
    console.log('\n🎉 Restoration complete!')
    
    // Verify the data
    const orchestraCount = await prisma.orchestra.count()
    const userCount = await prisma.user.count()
    console.log(`\n📊 Verification:`)
    console.log(`- Orchestras in database: ${orchestraCount}`)
    console.log(`- Users in database: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Error during restoration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()