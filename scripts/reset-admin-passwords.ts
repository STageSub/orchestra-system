import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-db'

async function resetAdminPasswords() {
  console.log('🔐 Resetting admin passwords...\n')
  
  try {
    // 1. Reset superadmin password
    const superadminPassword = 'superadmin123'
    const superadminHash = await hashPassword(superadminPassword)
    
    await prisma.user.update({
      where: { username: 'superadmin' },
      data: { passwordHash: superadminHash }
    })
    console.log('✅ Updated superadmin password to: superadmin123')
    
    // 2. Reset sco-admin password
    const scoAdminPassword = 'sco-admin123'
    const scoAdminHash = await hashPassword(scoAdminPassword)
    
    await prisma.user.update({
      where: { username: 'sco-admin' },
      data: { passwordHash: scoAdminHash }
    })
    console.log('✅ Updated sco-admin password to: sco-admin123')
    
    // 3. Reset scosco-admin password
    const scoscoAdminPassword = 'scosco-admin123'
    const scoscoAdminHash = await hashPassword(scoscoAdminPassword)
    
    await prisma.user.update({
      where: { username: 'scosco-admin' },
      data: { passwordHash: scoscoAdminHash }
    })
    console.log('✅ Updated scosco-admin password to: scosco-admin123')
    
    console.log('\n🎉 All passwords have been reset!')
    console.log('\n📝 Login credentials:')
    console.log('─'.repeat(50))
    console.log('1. Superadmin:')
    console.log('   URL: https://stagesub.com/admin/login')
    console.log('   Username: superadmin')
    console.log('   Password: superadmin123')
    console.log()
    console.log('2. SCO Admin:')
    console.log('   URL: https://sco.stagesub.com/admin/login')
    console.log('   Username: sco-admin')
    console.log('   Password: sco-admin123')
    console.log()
    console.log('3. SCOSO Admin:')
    console.log('   URL: https://scoso.stagesub.com/admin/login')
    console.log('   Username: scosco-admin')
    console.log('   Password: scosco-admin123')
    console.log('─'.repeat(50))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPasswords()