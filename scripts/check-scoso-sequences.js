const { PrismaClient } = require('@prisma/client')

async function checkScosoSequences() {
  // SCOSO database URL with encoded special characters
  const scosoDatabaseUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: scosoDatabaseUrl
      }
    }
  })

  try {
    console.log('🔍 Checking SCOSO IdSequence table...\n')
    
    // Check if table exists and get all sequences
    const sequences = await prisma.$queryRaw`
      SELECT * FROM "IdSequence" 
      ORDER BY "entityType"
    `
    
    if (sequences.length === 0) {
      console.log('❌ IdSequence table exists but is EMPTY!')
      console.log('This explains why project creation fails - no sequences are initialized.')
    } else {
      console.log(`✅ Found ${sequences.length} sequences:\n`)
      console.table(sequences)
    }
    
    // Check specifically for project sequence
    const projectSequence = sequences.find(s => s.entityType === 'project')
    if (!projectSequence) {
      console.log('\n❌ Missing "project" sequence - this is why project creation fails!')
    } else {
      console.log(`\n✅ Project sequence exists with lastNumber: ${projectSequence.lastNumber}`)
    }
    
  } catch (error) {
    console.error('❌ Error checking sequences:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkScosoSequences()
  .then(() => {
    console.log('\n✅ Check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error)
    process.exit(1)
  })