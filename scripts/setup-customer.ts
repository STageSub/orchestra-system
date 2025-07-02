#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  console.log('🚀 StageSub Customer Setup')
  console.log('=========================\n')

  // Get customer info
  const subdomain = await question('Enter customer subdomain (e.g., goteborg): ')
  const customerName = await question('Enter customer name (e.g., Göteborg Orchestra): ')
  const databaseUrl = await question('Enter database URL for this customer: ')

  console.log('\n📋 Summary:')
  console.log(`- Subdomain: ${subdomain}.stagesub.com`)
  console.log(`- Customer: ${customerName}`)
  console.log(`- Database: ${databaseUrl}\n`)

  const confirm = await question('Proceed with setup? (yes/no): ')
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Setup cancelled.')
    process.exit(0)
  }

  console.log('\n🔧 Setting up database...')

  // Run Prisma migrations on the new database
  process.env.DATABASE_URL = databaseUrl
  
  try {
    // Run migrations
    console.log('Running database migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    
    // Seed initial data
    console.log('\nSeeding initial data...')
    const prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl }
      }
    })
    
    // Add any initial seed data here
    // For example, email templates
    
    await prisma.$disconnect()
    
    console.log('\n✅ Setup complete!')
    console.log('\n📝 Next steps:')
    console.log(`1. Add to .env.local: DATABASE_URL_${subdomain.toUpperCase()}=${databaseUrl}`)
    console.log(`2. Update lib/database-config.ts to include '${subdomain}' in DATABASE_URLS`)
    console.log(`3. Configure DNS: ${subdomain}.stagesub.com → your server`)
    console.log(`4. The customer can now login at: https://${subdomain}.stagesub.com/admin`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }

  rl.close()
}

main().catch(console.error)