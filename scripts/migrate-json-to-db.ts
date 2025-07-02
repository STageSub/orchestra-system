import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface CustomerJson {
  id: string
  name: string
  subdomain: string
  databaseUrl: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  contactEmail: string
  plan: 'small' | 'medium' | 'enterprise'
}

interface OrchestraJson {
  id: string
  name: string
  subdomain: string
  contactName: string
  contactEmail: string
  databaseUrl?: string
  createdAt: string
  status: 'pending' | 'active' | 'inactive'
}

async function migrateCustomers() {
  try {
    const configPath = path.join(process.cwd(), 'customer-config.json')
    const configExists = await fs.access(configPath).then(() => true).catch(() => false)
    
    if (!configExists) {
      console.log('No customer-config.json found, skipping customer migration')
      return
    }
    
    const data = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(data) as { customers: CustomerJson[] }
    
    console.log(`Found ${config.customers.length} customers to migrate`)
    
    for (const customer of config.customers) {
      try {
        await prisma.customer.upsert({
          where: { subdomain: customer.subdomain },
          update: {
            name: customer.name,
            databaseUrl: customer.databaseUrl,
            status: customer.status,
            contactEmail: customer.contactEmail,
            plan: customer.plan
          },
          create: {
            id: customer.id,
            name: customer.name,
            subdomain: customer.subdomain,
            databaseUrl: customer.databaseUrl,
            status: customer.status,
            contactEmail: customer.contactEmail,
            plan: customer.plan,
            createdAt: new Date(customer.createdAt)
          }
        })
        console.log(`✅ Migrated customer: ${customer.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate customer ${customer.name}:`, error)
      }
    }
    
    // Rename the file to indicate it's been migrated
    await fs.rename(configPath, configPath + '.migrated')
    console.log('Renamed customer-config.json to customer-config.json.migrated')
  } catch (error) {
    console.error('Error migrating customers:', error)
  }
}

async function migrateOrchestras() {
  try {
    const configPath = path.join(process.cwd(), 'orchestra-config.json')
    const configExists = await fs.access(configPath).then(() => true).catch(() => false)
    
    if (!configExists) {
      console.log('No orchestra-config.json found, skipping orchestra migration')
      return
    }
    
    const data = await fs.readFile(configPath, 'utf-8')
    const orchestras = JSON.parse(data) as OrchestraJson[]
    
    console.log(`Found ${orchestras.length} orchestras to migrate`)
    
    for (const orchestra of orchestras) {
      try {
        await prisma.orchestra.upsert({
          where: { subdomain: orchestra.subdomain },
          update: {
            name: orchestra.name,
            contactName: orchestra.contactName,
            contactEmail: orchestra.contactEmail,
            databaseUrl: orchestra.databaseUrl,
            status: orchestra.status
          },
          create: {
            id: orchestra.id,
            name: orchestra.name,
            subdomain: orchestra.subdomain,
            contactName: orchestra.contactName,
            contactEmail: orchestra.contactEmail,
            databaseUrl: orchestra.databaseUrl,
            status: orchestra.status,
            createdAt: new Date(orchestra.createdAt)
          }
        })
        console.log(`✅ Migrated orchestra: ${orchestra.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate orchestra ${orchestra.name}:`, error)
      }
    }
    
    // Rename the file to indicate it's been migrated
    await fs.rename(configPath, configPath + '.migrated')
    console.log('Renamed orchestra-config.json to orchestra-config.json.migrated')
  } catch (error) {
    console.error('Error migrating orchestras:', error)
  }
}

async function main() {
  console.log('Starting JSON to database migration...')
  
  await migrateCustomers()
  await migrateOrchestras()
  
  console.log('Migration complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())