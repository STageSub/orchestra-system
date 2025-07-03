import { getPrismaClient } from '@/lib/database-config'

async function testDatabaseIsolation() {
  console.log('🧪 Testar databasisolering...\n')
  
  try {
    // Anslut till SCO-databasen
    console.log('1. Ansluter till SCO-databasen...')
    const scoPrisma = await getPrismaClient('sco')
    const scoMusicians = await scoPrisma.musician.count()
    const scoProjects = await scoPrisma.project.count()
    console.log(`   ✅ SCO har ${scoMusicians} musiker och ${scoProjects} projekt`)
    
    // Anslut till SCOSO-databasen
    console.log('\n2. Ansluter till SCOSO-databasen...')
    const scoscoPrisma = await getPrismaClient('scosco')
    const scoscoMusicians = await scoscoPrisma.musician.count()
    const scoscoProjects = await scoscoPrisma.project.count()
    console.log(`   ✅ SCOSO har ${scoscoMusicians} musiker och ${scoscoProjects} projekt`)
    
    // Verifiera isolation
    console.log('\n3. Verifierar isolation...')
    
    // Skapa testmusiker i SCOSO
    const testMusician = await scoscoPrisma.musician.create({
      data: {
        musicianId: 'TEST-001',
        firstName: 'Test',
        lastName: 'Isolation',
        email: 'test.isolation@scoso.com'
      }
    })
    console.log(`   ✅ Skapade testmusiker i SCOSO: ${testMusician.firstName} ${testMusician.lastName}`)
    
    // Verifiera att den INTE finns i SCO
    const scoCheck = await scoPrisma.musician.findUnique({
      where: { musicianId: 'TEST-001' }
    })
    
    if (!scoCheck) {
      console.log('   ✅ Testmusikern finns INTE i SCO-databasen')
      console.log('   🔒 DATABASISOLERING FUNGERAR!')
    } else {
      console.log('   ❌ KRITISKT: Testmusikern hittades i SCO!')
      console.log('   ⚠️  DATABASER ÄR INTE ISOLERADE!')
    }
    
    // Rensa upp
    await scoscoPrisma.musician.delete({
      where: { musicianId: 'TEST-001' }
    })
    console.log('\n4. Testdata borttagen.')
    
    console.log('\n✅ Test komplett!')
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error)
  }
}

testDatabaseIsolation()