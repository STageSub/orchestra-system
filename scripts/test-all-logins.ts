import { authenticateUser } from '../lib/auth-db'

async function testAllLogins() {
  console.log('🔐 Testing all user logins...\n')
  
  const testCases = [
    { 
      username: 'superadmin', 
      password: 'admin123',
      description: 'Superadmin login'
    },
    { 
      username: 'Daniel', 
      password: 'orchestra123',
      description: 'SCO Orchestra admin'
    },
    { 
      username: 'Daniel2', 
      password: 'orchestra123',
      description: 'SCOSO Orchestra admin'
    }
  ]
  
  let allSuccess = true
  
  for (const test of testCases) {
    console.log(`Testing: ${test.description}`)
    console.log(`Username: ${test.username}`)
    console.log(`Password: ${test.password}`)
    
    const user = await authenticateUser(test.username, test.password)
    
    if (user) {
      console.log(`✅ SUCCESS! Logged in as ${user.username} (${user.role})`)
      if (user.orchestraId) {
        console.log(`   Orchestra: ${(user as any).orchestra?.name || user.orchestraId}`)
      }
    } else {
      console.log(`❌ FAILED to authenticate`)
      allSuccess = false
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
  
  if (allSuccess) {
    console.log('🎉 All logins working correctly!')
  } else {
    console.log('⚠️  Some logins failed. Please check the errors above.')
  }
  
  process.exit(allSuccess ? 0 : 1)
}

testAllLogins().catch(console.error)