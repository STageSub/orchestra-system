import { authenticateUser } from '../lib/auth-db'

async function testAuth() {
  console.log('Testing authentication...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  
  const testCases = [
    { username: 'superadmin', password: 'superadmin123' },
    { username: 'sco-admin', password: 'admin123' },
    { username: 'scosco-admin', password: 'admin123' }
  ]
  
  for (const test of testCases) {
    console.log(`\nTesting ${test.username} with password ${test.password}`)
    const user = await authenticateUser(test.username, test.password)
    if (user) {
      console.log(`✅ Success! User: ${user.username}, Role: ${user.role}`)
    } else {
      console.log(`❌ Failed to authenticate`)
    }
  }
  
  process.exit(0)
}

testAuth().catch(console.error)