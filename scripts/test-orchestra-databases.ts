import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testDatabase(name: string, databaseUrl: string) {
  console.log(`\n=== Testing ${name} Database ===`)
  console.log(`URL: ${databaseUrl.substring(0, 50)}...`)
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })

    // Test connection
    await prisma.$connect()
    console.log('✅ Connection successful')

    // Count musicians
    try {
      const totalMusicians = await prisma.musician.count()
      const activeMusicians = await prisma.musician.count({
        where: { isActive: true }
      })
      console.log(`Musicians: ${totalMusicians} total, ${activeMusicians} active`)
    } catch (e: any) {
      console.log('❌ Error counting musicians:', e.message)
    }

    // Count projects
    try {
      const totalProjects = await prisma.project.count()
      const activeProjects = await prisma.project.count({
        where: { 
          startDate: { gte: new Date() }
        }
      })
      console.log(`Projects: ${totalProjects} total, ${activeProjects} active`)
    } catch (e: any) {
      console.log('❌ Error counting projects:', e.message)
    }

    // Count requests
    try {
      const totalRequests = await prisma.request.count()
      const acceptedRequests = await prisma.request.count({
        where: { status: 'accepted' }
      })
      console.log(`Requests: ${totalRequests} total, ${acceptedRequests} accepted`)
    } catch (e: any) {
      console.log('❌ Error counting requests:', e.message)
    }

    // Disconnect
    await prisma.$disconnect()
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
  }
}

async function main() {
  console.log('Testing Orchestra Database Connections...\n')

  // Test environment variables
  console.log('=== Environment Variables ===')
  const scoUrl = process.env.DATABASE_URL_SCO
  const scosoUrl = process.env.DATABASE_URL_SCOSO
  
  console.log(`DATABASE_URL_SCO: ${scoUrl ? 'Found' : 'Missing'}`)
  console.log(`DATABASE_URL_SCOSO: ${scosoUrl ? 'Found' : 'Missing'}`)

  // Test main database (Neon) to check Orchestra configuration
  console.log('\n=== Orchestra Configuration in Main Database ===')
  const mainPrisma = new PrismaClient()
  
  try {
    const orchestras = await mainPrisma.$queryRaw`
      SELECT "orchestraId", name, "databaseUrl", status 
      FROM "Orchestra" 
      WHERE status = 'active'
      ORDER BY name
    ` as any[]

    console.log(`Found ${orchestras.length} active orchestras:`)
    orchestras.forEach(o => {
      console.log(`- ${o.orchestraId}: ${o.name}`)
      console.log(`  Database: ${o.databaseUrl.substring(0, 50)}...`)
      console.log(`  Matches env? ${
        o.orchestraId === 'SCO' ? o.databaseUrl === scoUrl : 
        o.orchestraId === 'SCOSO' ? o.databaseUrl === scosoUrl : 
        'N/A'
      }`)
    })
  } catch (error: any) {
    console.error('❌ Error querying Orchestra table:', error.message)
  } finally {
    await mainPrisma.$disconnect()
  }

  // Test individual orchestra databases
  if (scoUrl) {
    await testDatabase('SCO', scoUrl)
  } else {
    console.log('\n❌ Skipping SCO test - DATABASE_URL_SCO not found')
  }

  if (scosoUrl) {
    await testDatabase('SCOSO', scosoUrl)
  } else {
    console.log('\n❌ Skipping SCOSO test - DATABASE_URL_SCOSO not found')
  }

  // Test if tables exist in databases
  console.log('\n=== Table Structure Check ===')
  if (scoUrl) {
    const scoPrisma = new PrismaClient({
      datasources: { db: { url: scoUrl } }
    })
    try {
      const tables = await scoPrisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      ` as any[]
      console.log(`SCO database tables: ${tables.map(t => t.table_name).join(', ')}`)
    } catch (e: any) {
      console.log('❌ Error listing SCO tables:', e.message)
    } finally {
      await scoPrisma.$disconnect()
    }
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })