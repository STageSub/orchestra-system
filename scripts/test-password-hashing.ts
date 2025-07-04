import bcrypt from 'bcryptjs'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { hashPassword, verifyPasswordHash } from '@/lib/auth-db'

async function testPasswordHashing() {
  console.log('🔐 Testing Password Hashing and Verification...\n')
  
  try {
    // Test 1: Basic bcrypt functionality
    console.log('1. Testing basic bcrypt functionality:')
    const testPassword = 'superadmin123'
    const directHash = await bcrypt.hash(testPassword, 10)
    const directVerify = await bcrypt.compare(testPassword, directHash)
    console.log(`Direct bcrypt hash/verify: ${directVerify ? '✅ Works' : '❌ Failed'}`)
    
    // Test 2: Test our wrapper functions
    console.log('\n2. Testing our wrapper functions:')
    const ourHash = await hashPassword(testPassword)
    const ourVerify = await verifyPasswordHash(testPassword, ourHash)
    console.log(`Our hash/verify functions: ${ourVerify ? '✅ Works' : '❌ Failed'}`)
    
    // Test 3: Get current hashes from database
    console.log('\n3. Testing existing database hashes:')
    const users = await neonPrisma.user.findMany({
      where: {
        username: { in: ['superadmin', 'sco-admin', 'scosco-admin'] }
      }
    })
    
    for (const user of users) {
      console.log(`\n👤 ${user.username}:`)
      console.log(`   Hash: ${user.passwordHash.substring(0, 30)}...`)
      
      // Test expected passwords
      const passwords = {
        'superadmin': 'superadmin123',
        'sco-admin': 'sco-admin123',
        'scosco-admin': 'scosco-admin123'
      }
      
      const expectedPassword = passwords[user.username as keyof typeof passwords]
      if (expectedPassword) {
        const isValid = await verifyPasswordHash(expectedPassword, user.passwordHash)
        console.log(`   Password "${expectedPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`)
        
        // Try with bcrypt directly
        const directValid = await bcrypt.compare(expectedPassword, user.passwordHash)
        console.log(`   Direct bcrypt check: ${directValid ? '✅ Valid' : '❌ Invalid'}`)
      }
    }
    
    // Test 4: Update one user with a fresh hash
    console.log('\n4. Creating fresh hash for superadmin:')
    const freshHash = await hashPassword('superadmin123')
    console.log(`New hash: ${freshHash.substring(0, 30)}...`)
    
    await neonPrisma.user.update({
      where: { username: 'superadmin' },
      data: { passwordHash: freshHash }
    })
    
    // Verify the fresh hash works
    const updatedUser = await neonPrisma.user.findUnique({
      where: { username: 'superadmin' }
    })
    
    if (updatedUser) {
      const verifyFresh = await verifyPasswordHash('superadmin123', updatedUser.passwordHash)
      console.log(`Fresh hash verification: ${verifyFresh ? '✅ Works' : '❌ Failed'}`)
    }
    
    // Test 5: Test the full authentication function
    console.log('\n5. Testing full authenticateUser function:')
    const { authenticateUser } = await import('@/lib/auth-db')
    const authResult = await authenticateUser('superadmin', 'superadmin123')
    console.log(`Authentication: ${authResult ? '✅ Success' : '❌ Failed'}`)
    if (authResult) {
      console.log(`Authenticated as: ${authResult.username} (${authResult.role})`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

testPasswordHashing()