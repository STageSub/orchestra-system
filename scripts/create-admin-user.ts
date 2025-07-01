import { prismaMultitenant } from '../lib/prisma-multitenant'
import { hashPassword } from '../lib/auth-node'

async function createAdminUser() {
  try {
    console.log('Creating admin user for default tenant...')
    
    // First check if default tenant exists
    let tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: 'default-tenant' }
    })
    
    // If not, check by subdomain
    if (!tenant) {
      tenant = await prismaMultitenant.tenant.findUnique({
        where: { subdomain: 'default' }
      })
    }
    
    if (!tenant) {
      console.log('Default tenant not found. Creating it...')
      tenant = await prismaMultitenant.tenant.create({
        data: {
          id: 'default-tenant',
          name: 'Default Orchestra',
          subdomain: 'default',
          subscription: 'institution',
          maxMusicians: 999999,
          maxActiveProjects: 999999,
          maxInstruments: 999999,
          subscriptionStatus: 'active'
        }
      })
    }
    
    // Check if admin already exists
    const existingAdmin = await prismaMultitenant.user.findUnique({
      where: { email: 'admin@orchestra.local' }
    })
    
    if (existingAdmin) {
      console.log('Admin user already exists!')
      // Update password
      const hashedPassword = await hashPassword('orchestra123')
      await prismaMultitenant.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword }
      })
      console.log('Password updated to: orchestra123')
      return
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('orchestra123')
    
    const user = await prismaMultitenant.user.create({
      data: {
        email: 'admin@orchestra.local',
        password: hashedPassword,
        name: 'Orchestra Admin',
        role: 'admin',
        tenantId: tenant.id
      }
    })
    
    console.log('Admin user created successfully!')
    console.log('Email: admin@orchestra.local')
    console.log('Password: orchestra123')
    console.log('Tenant:', tenant.name)
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prismaMultitenant.$disconnect()
  }
}

// Run the script
createAdminUser()