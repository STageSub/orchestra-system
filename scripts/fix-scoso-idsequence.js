const { PrismaClient } = require('@prisma/client')

async function fixScosoIdSequence() {
  // SCOSO database URL with encoded special characters
  const databaseUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    console.log('Connecting to SCOSO database...')
    
    // First check if sequences already exist
    const existingSequences = await prisma.$queryRaw`
      SELECT * FROM "IdSequence" 
      ORDER BY "entityType"
    `
    
    if (existingSequences.length > 0) {
      console.log(`\nFound ${existingSequences.length} existing sequences. Checking for missing ones...`)
    } else {
      console.log('\nIdSequence table is empty. Initializing all sequences...')
    }
    
    // List of all entity types that need sequences
    const entityTypes = [
      'musician',
      'project', 
      'request',
      'instrument',
      'position',
      'rankingList',
      'ranking',
      'projectNeed',
      'emailTemplate',
      'communicationLog',
      'projectFile',
      'auditLog'
    ]
    
    // Insert missing sequences
    for (const entityType of entityTypes) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "IdSequence" ("entityType", "lastNumber", "updatedAt")
          VALUES (${entityType}, 0, CURRENT_TIMESTAMP)
          ON CONFLICT ("entityType") DO NOTHING
        `
        console.log(`✅ Ensured sequence for: ${entityType}`)
      } catch (error) {
        console.error(`❌ Error creating sequence for ${entityType}:`, error.message)
      }
    }
    
    console.log('\n✅ All sequences initialized!')
    
    // Verify the sequences were created
    const finalSequences = await prisma.$queryRaw`
      SELECT * FROM "IdSequence" 
      ORDER BY "entityType"
    `
    
    console.log(`\n📊 Final state: ${finalSequences.length} sequences in database:`)
    console.table(finalSequences.map(s => ({
      entityType: s.entityType,
      lastNumber: s.lastNumber
    })))
    
  } catch (error) {
    console.error('❌ Error fixing IdSequence table:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixScosoIdSequence()
  .then(() => {
    console.log('\n✅ SCOSO IdSequence fix completed!')
    console.log('Project creation should now work for scoso-admin.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ SCOSO IdSequence fix failed:', error)
    process.exit(1)
  })