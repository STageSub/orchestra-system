import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-db'

async function createMissingUsers() {
  try {
    // Find orchestras without admin users
    const orchestras = await prisma.orchestra.findMany()
    
    for (const orchestra of orchestras) {
      // Check if admin user exists
      const adminUser = await prisma.user.findFirst({
        where: {
          orchestraId: orchestra.id,
          role: 'admin'
        }
      })
      
      if (!adminUser) {
        console.log(`Creating admin user for ${orchestra.name}...`)
        
        // Generate password
        const password = 'admin123' // You should generate a secure password
        const passwordHash = await hashPassword(password)
        
        // Create admin user
        const user = await prisma.user.create({
          data: {
            username: `${orchestra.subdomain}-admin`,
            email: `admin@${orchestra.subdomain}.stagesub.com`,
            passwordHash,
            role: 'admin',
            orchestraId: orchestra.id,
            active: true
          }
        })
        
        console.log(`✅ Created user: ${user.username} (password: ${password})`)
      } else {
        console.log(`✓ Admin user already exists for ${orchestra.name}`)
      }
    }
    
    // Also create superadmin if not exists
    const superadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })
    
    if (!superadmin) {
      const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123'
      const passwordHash = await hashPassword(superadminPassword)
      
      await prisma.user.create({
        data: {
          username: 'superadmin',
          email: 'superadmin@stagesub.com',
          passwordHash,
          role: 'superadmin',
          active: true
        }
      })
      
      console.log(`✅ Created superadmin user (password: ${superadminPassword})`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingUsers()