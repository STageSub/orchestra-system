import { prisma } from '@/lib/prisma'

async function testUserDatabases() {
  console.log('🧪 Testar användar-databaskoppling\n')
  
  try {
    // Hämta alla användare med orkester
    const users = await prisma.user.findMany({
      where: {
        orchestraId: { not: null },
        role: 'admin'
      },
      include: {
        orchestra: true
      }
    })
    
    console.log('Användare med orkester:')
    console.log('=======================')
    
    for (const user of users) {
      console.log(`\n👤 ${user.username}`)
      console.log(`   📧 ${user.email}`)
      console.log(`   🏛️  ${user.orchestra?.name || 'Ingen orkester'}`)
      console.log(`   🌐 ${user.orchestra?.subdomain || 'Ingen subdomän'}`)
      console.log(`   💾 ${user.orchestra?.databaseUrl ? 'Har egen databas' : 'Ingen databas'}`)
    }
    
    console.log('\n📝 Test:')
    console.log('1. Gå till http://localhost:3000/admin/login')
    console.log('2. Logga in som någon av användarna ovan')
    console.log('3. Du ska nu se data från rätt databas!')
    console.log('\n✨ Ingen subdomän behövs längre!')
    
  } catch (error) {
    console.error('Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserDatabases()