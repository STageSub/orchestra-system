const { PrismaClient } = require('@prisma/client')

async function checkIdSequenceStructure() {
  // Database URLs
  const scoDatabaseUrl = 'postgresql://postgres.tckcuexsdzovsqaqiqkr:Kurdistan12@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  const scosoDatabaseUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const scoPrisma = new PrismaClient({
    datasources: {
      db: {
        url: scoDatabaseUrl
      }
    }
  })

  const scosoPrisma = new PrismaClient({
    datasources: {
      db: {
        url: scosoDatabaseUrl
      }
    }
  })

  try {
    console.log('🔍 Checking IdSequence table structure...\n')
    
    // Get SCO IdSequence columns
    console.log('📊 SCO IdSequence columns:')
    const scoColumns = await scoPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'IdSequence'
      ORDER BY ordinal_position
    `
    console.table(scoColumns)
    
    // Get SCOSO IdSequence columns
    console.log('\n📊 SCOSO IdSequence columns:')
    const scosoColumns = await scosoPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'IdSequence'
      ORDER BY ordinal_position
    `
    console.table(scosoColumns)
    
  } catch (error) {
    console.error('❌ Error checking structure:', error)
    throw error
  } finally {
    await scoPrisma.$disconnect()
    await scosoPrisma.$disconnect()
  }
}

// Run the check
checkIdSequenceStructure()
  .then(() => {
    console.log('\n✅ Structure check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Structure check failed:', error)
    process.exit(1)
  })