import { authenticateUser } from '@/lib/auth-db'
import { neonPrisma } from '@/lib/prisma-dynamic'

async function testLoginAPI() {
  console.log('🔍 Testing Login API Flow...\n')
  
  try {
    // Test 1: Check if users exist
    console.log('1. Checking users in database:')
    const users = await neonPrisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        active: true
      }
    })
    
    for (const user of users) {
      console.log(`   ${user.username} - ${user.role} - Active: ${user.active}`)
    }
    
    // Test 2: Test authentication for each user
    console.log('\n2. Testing authentication for each user:')
    
    const testCases = [
      { username: 'superadmin', password: 'superadmin123' },
      { username: 'sco-admin', password: 'sco-admin123' },
      { username: 'scosco-admin', password: 'scosco-admin123' }
    ]
    
    for (const { username, password } of testCases) {
      console.log(`\nTesting ${username}:`)
      
      try {
        const result = await authenticateUser(username, password)
        
        if (result) {
          console.log(`   ✅ Authentication successful`)
          console.log(`   User ID: ${result.id}`)
          console.log(`   Role: ${result.role}`)
          console.log(`   Orchestra ID: ${result.orchestraId || 'None'}`)
        } else {
          console.log(`   ❌ Authentication failed (returned null)`)
        }
      } catch (error) {
        console.log(`   ❌ Error during authentication:`, error)
      }
    }
    
    // Test 3: Simulate exact API request
    console.log('\n3. Simulating API login request:')
    
    // Import the necessary functions
    const { createToken: createDbToken } = await import('@/lib/auth-db')
    
    // Test superadmin login
    const username = 'superadmin'
    const password = 'superadmin123'
    
    console.log(`\nSimulating login for ${username}:`)
    
    const user = await authenticateUser(username, password)
    
    if (!user) {
      console.log('❌ Authentication failed - would return 401')
    } else {
      console.log('✅ Authentication successful')
      
      // Try to create token
      try {
        const token = await createDbToken(user, undefined)
        console.log(`✅ Token created successfully`)
        console.log(`Token length: ${token.length}`)
        console.log(`Token preview: ${token.substring(0, 50)}...`)
      } catch (error) {
        console.log('❌ Error creating token:', error)
      }
    }
    
    // Test 4: Check environment
    console.log('\n4. Environment check:')
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`JWT_SECRET exists: ${!!process.env.JWT_SECRET}`)
    console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`)
    console.log(`DATABASE_URL contains neon: ${process.env.DATABASE_URL?.includes('neon')}`)
    
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

testLoginAPI()