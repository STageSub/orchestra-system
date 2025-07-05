import { PrismaClient } from '@prisma/client'

async function verifyOrchestraDatabase(name: string, databaseUrl: string) {
  console.log(`\n🔍 Verifying ${name} database...`)
  console.log(`   URL: ${databaseUrl.substring(0, 50)}...`)
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })
  
  try {
    // Check key tables and counts
    const musicians = await prisma.musician.count()
    const instruments = await prisma.instrument.count()
    const positions = await prisma.position.count()
    const projects = await prisma.project.count()
    const emailTemplates = await prisma.emailTemplate.count()
    
    console.log(`   ✅ Musicians: ${musicians}`)
    console.log(`   ✅ Instruments: ${instruments}`)
    console.log(`   ✅ Positions: ${positions}`)
    console.log(`   ✅ Projects: ${projects}`)
    console.log(`   ✅ Email Templates: ${emailTemplates}`)
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    console.log(`   ✅ Total tables: ${tables.length}`)
    
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error}`)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('🎯 Verifying Orchestra Databases')
  console.log('================================')
  
  // Get orchestra data from central database
  const centralPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    const orchestras = await centralPrisma.orchestra.findMany({
      where: { status: 'active' }
    })
    
    console.log(`Found ${orchestras.length} active orchestras in central database`)
    
    for (const orchestra of orchestras) {
      if (orchestra.databaseUrl) {
        await verifyOrchestraDatabase(orchestra.name, orchestra.databaseUrl)
      } else {
        console.log(`\n⚠️  ${orchestra.name} has no database URL`)
      }
    }
    
    console.log('\n✅ Verification complete!')
    
  } catch (error) {
    console.error('❌ Error accessing central database:', error)
  } finally {
    await centralPrisma.$disconnect()
  }
}

main()