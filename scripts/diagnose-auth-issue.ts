import { neonPrisma } from '@/lib/prisma-dynamic'
import { hashPassword, verifyPassword } from '@/lib/auth-db'

async function diagnoseAuthIssue() {
  console.log('🔍 Diagnosing Authentication Issues...\n')
  
  try {
    // 1. Check if we can connect to the database
    console.log('1. Testing database connection...')
    try {
      await neonPrisma.$connect()
      console.log('✅ Database connection successful')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return
    }
    
    // 2. Check if User table exists
    console.log('\n2. Checking if User table exists...')
    try {
      const tableCheck = await neonPrisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `
      console.log('✅ User table exists:', tableCheck)
    } catch (error) {
      console.error('❌ Error checking User table:', error)
    }
    
    // 3. List all users
    console.log('\n3. Listing all users in the database...')
    try {
      const users = await neonPrisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          passwordHash: true
        }
      })
      
      console.log(`Found ${users.length} users:`)
      for (const user of users) {
        console.log(`\n👤 ${user.username}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Active: ${user.active}`)
        console.log(`   Created: ${user.createdAt}`)
        console.log(`   Hash exists: ${user.passwordHash ? 'Yes' : 'No'}`)
        console.log(`   Hash start: ${user.passwordHash?.substring(0, 20)}...`)
      }
    } catch (error) {
      console.error('❌ Error listing users:', error)
    }
    
    // 4. Test password verification
    console.log('\n4. Testing password verification...')
    try {
      // Find superadmin
      const superadmin = await neonPrisma.user.findUnique({
        where: { username: 'superadmin' }
      })
      
      if (superadmin) {
        console.log('\nTesting superadmin password:')
        const testPassword = 'superadmin123'
        const isValid = await verifyPassword(testPassword, superadmin.passwordHash)
        console.log(`Password "${testPassword}" is valid: ${isValid}`)
        
        // Test with a new hash to ensure bcrypt works
        console.log('\nTesting bcrypt functionality:')
        const newHash = await hashPassword(testPassword)
        const verifyNew = await verifyPassword(testPassword, newHash)
        console.log(`New hash verification: ${verifyNew}`)
        console.log(`New hash: ${newHash.substring(0, 20)}...`)
      } else {
        console.log('❌ Superadmin user not found!')
      }
    } catch (error) {
      console.error('❌ Error testing password verification:', error)
    }
    
    // 5. Check environment variables
    console.log('\n5. Checking environment variables...')
    console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`)
    console.log(`DATABASE_URL points to: ${process.env.DATABASE_URL?.includes('neon') ? 'Neon' : 'Unknown'}`)
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
    
    // 6. Test the actual authentication function
    console.log('\n6. Testing authenticateUser function...')
    try {
      const { authenticateUser } = await import('@/lib/auth-db')
      const result = await authenticateUser('superadmin', 'superadmin123')
      console.log('Authentication result:', result ? '✅ Success' : '❌ Failed')
      if (result) {
        console.log('Authenticated user:', result.username, result.role)
      }
    } catch (error) {
      console.error('❌ Error testing authenticateUser:', error)
    }
    
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

diagnoseAuthIssue()