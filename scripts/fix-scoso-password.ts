import { prisma } from '@/lib/prisma'

async function fixScoscoPassword() {
  console.log('🔧 Uppdaterar SCOSO databas-URL med rätt lösenord...\n')
  
  try {
    // Det korrekta lösenordet från .env.local
    const correctUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    
    // Uppdatera SCOSO
    const result = await prisma.orchestra.update({
      where: { subdomain: 'scosco' },
      data: { databaseUrl: correctUrl }
    })
    
    console.log('✅ Uppdaterat SCOSO databas-URL')
    console.log(`   Orkester: ${result.name}`)
    console.log(`   Subdomän: ${result.subdomain}`)
    
    // Testa anslutningen
    console.log('\n🧪 Testar anslutning...')
    const { PrismaClient } = require('@prisma/client')
    const testPrisma = new PrismaClient({
      datasources: {
        db: { url: correctUrl }
      }
    })
    
    try {
      await testPrisma.$connect()
      console.log('✅ Anslutning fungerar!')
      
      // Kolla om databasen är tom
      const musicianCount = await testPrisma.musician.count()
      console.log(`\nData i databasen: ${musicianCount} musiker`)
      
      if (musicianCount === 0) {
        console.log('\n⚠️  Databasen är tom!')
        console.log('Kör följande kommando för att sätta upp databasen:')
        console.log(`\nnpx tsx scripts/setup-orchestra-complete.ts "${correctUrl}" "Orchestra SCOSO" "scosco"\n`)
      }
      
      await testPrisma.$disconnect()
    } catch (error) {
      console.error('❌ Anslutning misslyckades:', error.message)
    }
    
  } catch (error) {
    console.error('Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixScoscoPassword()