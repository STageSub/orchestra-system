import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function updateCredentials() {
  console.log('🔄 Updating user credentials...\n')
  
  try {
    // 1. Update superadmin password to admin123
    console.log('1️⃣ Updating superadmin password...')
    const superadminHash = await bcrypt.hash('admin123', 10)
    await prisma.user.update({
      where: { username: 'superadmin' },
      data: { passwordHash: superadminHash }
    })
    console.log('✅ Superadmin password updated to: admin123')
    
    // 2. Update SCO admin: username to Daniel, password to orchestra123
    console.log('\n2️⃣ Updating SCO admin...')
    const orchestraHash = await bcrypt.hash('orchestra123', 10)
    await prisma.user.update({
      where: { username: 'sco-admin' },
      data: { 
        username: 'Daniel',
        passwordHash: orchestraHash
      }
    })
    console.log('✅ SCO admin updated:')
    console.log('   Username: Daniel')
    console.log('   Password: orchestra123')
    
    // 3. Update SCOSO admin: username to Daniel2, password to orchestra123
    console.log('\n3️⃣ Updating SCOSO admin...')
    await prisma.user.update({
      where: { username: 'scosco-admin' },
      data: { 
        username: 'Daniel2',
        passwordHash: orchestraHash // Same password hash as Daniel
      }
    })
    console.log('✅ SCOSO admin updated:')
    console.log('   Username: Daniel2')
    console.log('   Password: orchestra123')
    
    // Verify the updates
    console.log('\n📊 Verifying updates...')
    const users = await prisma.user.findMany({
      include: { orchestra: true },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('\n🔐 Final credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    for (const user of users) {
      console.log(`Username: ${user.username}`)
      console.log(`Role: ${user.role}`)
      console.log(`Orchestra: ${user.orchestra?.name || 'N/A (Superadmin)'}`)
      console.log(`Password: ${
        user.username === 'superadmin' ? 'admin123' : 
        user.username.startsWith('Daniel') ? 'orchestra123' : 
        'Unknown'
      }`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
    
    console.log('\n✅ All credentials updated successfully!')
    
  } catch (error) {
    console.error('❌ Error updating credentials:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCredentials()