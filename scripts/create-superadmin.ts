import { prismaMultitenant } from '../lib/prisma-multitenant'
import { hashPassword } from '../lib/auth-node'

async function createSuperadmin() {
  try {
    console.log('Creating superadmin user...')
    
    // Check if user already exists
    const existingUser = await prismaMultitenant.user.findUnique({
      where: { email: 'superadmin@stagesub.com' }
    })
    
    if (existingUser) {
      console.log('Superadmin already exists!')
      return
    }
    
    // Create superadmin user
    const hashedPassword = await hashPassword('superadmin123')
    
    const user = await prismaMultitenant.user.create({
      data: {
        email: 'superadmin@stagesub.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'superadmin',
        // Superadmins don't belong to a specific tenant
        tenantId: null
      }
    })
    
    console.log('Superadmin created successfully!')
    console.log('Email: superadmin@stagesub.com')
    console.log('Password: superadmin123')
    console.log('User ID:', user.id)
    
  } catch (error) {
    console.error('Error creating superadmin:', error)
  } finally {
    await prismaMultitenant.$disconnect()
  }
}

// Run the script
createSuperadmin()