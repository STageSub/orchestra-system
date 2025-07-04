import { neonPrisma } from '@/lib/prisma-dynamic'
import { hashPassword } from '@/lib/auth-db'

async function fixProductionAuth() {
  console.log('🔧 Fixing Production Authentication...\n')
  
  try {
    // Connect to Neon database
    await neonPrisma.$connect()
    console.log('✅ Connected to Neon database')
    
    // Check if User table exists
    try {
      const tableExists = await neonPrisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `
      console.log('User table exists:', tableExists)
    } catch (error) {
      console.error('Error checking User table:', error)
      console.log('\n⚠️  User table might not exist. Creating users...')
    }
    
    // Define users to create/update
    const users = [
      {
        username: 'superadmin',
        email: 'superadmin@stagesub.com',
        password: 'superadmin123',
        role: 'superadmin',
        orchestraId: null
      },
      {
        username: 'sco-admin',
        email: 'admin@sco.stagesub.com',
        password: 'sco-admin123',
        role: 'admin',
        orchestraId: 'cmcnbutg10000smyy9bg24gqt' // SCO orchestra ID
      },
      {
        username: 'scosco-admin',
        email: 'admin@scosco.stagesub.com',
        password: 'scosco-admin123',
        role: 'admin',
        orchestraId: 'cmcndgrlg0003smjayd5wv928' // SCOSCO orchestra ID
      }
    ]
    
    for (const userData of users) {
      console.log(`\n👤 Processing ${userData.username}...`)
      
      try {
        // Check if user exists
        const existingUser = await neonPrisma.user.findUnique({
          where: { username: userData.username }
        })
        
        const passwordHash = await hashPassword(userData.password)
        
        if (existingUser) {
          // Update existing user
          await neonPrisma.user.update({
            where: { username: userData.username },
            data: {
              passwordHash,
              email: userData.email,
              active: true
            }
          })
          console.log(`✅ Updated ${userData.username}`)
        } else {
          // Create new user
          await neonPrisma.user.create({
            data: {
              username: userData.username,
              email: userData.email,
              passwordHash,
              role: userData.role as any,
              orchestraId: userData.orchestraId,
              active: true
            }
          })
          console.log(`✅ Created ${userData.username}`)
        }
      } catch (error) {
        console.error(`❌ Error processing ${userData.username}:`, error)
      }
    }
    
    // Verify all users
    console.log('\n📋 Verifying all users:')
    const allUsers = await neonPrisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        active: true,
        orchestraId: true
      }
    })
    
    for (const user of allUsers) {
      console.log(`   ${user.username} - ${user.role} - Active: ${user.active}`)
    }
    
    console.log('\n✅ Production authentication fix complete!')
    console.log('\n📝 Login credentials:')
    console.log('─'.repeat(50))
    console.log('1. Superadmin:')
    console.log('   Username: superadmin')
    console.log('   Password: superadmin123')
    console.log()
    console.log('2. SCO Admin:')
    console.log('   Username: sco-admin')
    console.log('   Password: sco-admin123')
    console.log()
    console.log('3. SCOSCO Admin:')
    console.log('   Username: scosco-admin')
    console.log('   Password: scosco-admin123')
    console.log('─'.repeat(50))
    
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

// Run the fix
fixProductionAuth()