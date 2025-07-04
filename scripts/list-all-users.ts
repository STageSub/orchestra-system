import { prisma } from '@/lib/prisma'

async function listAllUsers() {
  console.log('📋 Listing all users in the database...\n')
  
  try {
    const users = await prisma.user.findMany({
      include: {
        orchestra: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${users.length} users:\n`)
    
    for (const user of users) {
      console.log('─'.repeat(50))
      console.log(`👤 Username: ${user.username}`)
      console.log(`📧 Email: ${user.email}`)
      console.log(`🔑 Role: ${user.role}`)
      console.log(`✅ Active: ${user.active}`)
      console.log(`🏛️  Orchestra: ${user.orchestra?.name || 'None (Superadmin)'}`)
      console.log(`🌐 Subdomain: ${user.orchestra?.subdomain || 'N/A'}`)
      console.log(`📅 Created: ${user.createdAt}`)
      console.log(`🔐 Password Hash: ${user.passwordHash.substring(0, 20)}...`)
    }
    
    console.log('\n' + '─'.repeat(50))
    console.log('\n💡 Note: Passwords are hashed with bcrypt.')
    console.log('   Default passwords from scripts:')
    console.log('   - superadmin: Uses SUPERADMIN_PASSWORD env var (currently: superadmin123)')
    console.log('   - Orchestra admins: Usually "{subdomain}-admin123" or "admin123"')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllUsers()