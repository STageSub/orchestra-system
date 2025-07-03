import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

async function verifyDatabaseIsolation() {
  console.log('🔍 Verifierar databasisolering...\n')
  
  try {
    // 1. Hämta alla orkestrar
    const orchestras = await prisma.orchestra.findMany({
      select: {
        name: true,
        subdomain: true,
        databaseUrl: true,
        status: true
      }
    })
    
    console.log('📊 Orkestrar i systemet:')
    console.log('========================')
    
    // Kontrollera för duplicerade databaser
    const databaseMap = new Map<string, string[]>()
    
    for (const orch of orchestras) {
      console.log(`\n${orch.name} (${orch.subdomain})`)
      console.log(`Status: ${orch.status}`)
      
      if (orch.databaseUrl) {
        // Extrahera projekt-ID från URL
        const projectId = orch.databaseUrl.match(/postgres\.(\w+):/)?.[1]
        console.log(`Supabase projekt: ${projectId}`)
        
        // Gruppera orkestrar som delar databas
        const dbIdentifier = projectId || 'unknown'
        if (!databaseMap.has(dbIdentifier)) {
          databaseMap.set(dbIdentifier, [])
        }
        databaseMap.get(dbIdentifier)!.push(orch.subdomain)
        
        // Testa anslutning
        console.log('Testar anslutning...')
        const testPrisma = new PrismaClient({
          datasources: {
            db: { url: orch.databaseUrl }
          }
        })
        
        try {
          await testPrisma.$connect()
          console.log('✅ Anslutning fungerar!')
          
          // Räkna data i databasen
          const counts = await Promise.all([
            testPrisma.musician.count(),
            testPrisma.project.count(),
            testPrisma.request.count()
          ])
          
          console.log(`   Musiker: ${counts[0]}`)
          console.log(`   Projekt: ${counts[1]}`)
          console.log(`   Förfrågningar: ${counts[2]}`)
          
          await testPrisma.$disconnect()
        } catch (error) {
          console.error('❌ Anslutning misslyckades:', error.message)
        }
      } else {
        console.log('⚠️  Ingen databas tilldelad!')
      }
    }
    
    // Rapportera databaser som delas
    console.log('\n\n🔒 Databasisolering:')
    console.log('====================')
    
    let hasIsolationIssues = false
    
    for (const [db, orchs] of databaseMap) {
      if (orchs.length > 1) {
        hasIsolationIssues = true
        console.log(`\n❌ KRITISKT: Databas ${db} delas av:`)
        orchs.forEach(o => console.log(`   - ${o}`))
      } else {
        console.log(`\n✅ ${orchs[0]} har egen databas (${db})`)
      }
    }
    
    if (!hasIsolationIssues) {
      console.log('\n✅ Perfekt! Alla orkestrar har sina egna databaser.')
    } else {
      console.log('\n⚠️  VARNING: Databasisolering är bruten!')
      console.log('Orkestrar som delar databas kan se varandras data.')
    }
    
    // Förslag på validering för att förhindra detta
    console.log('\n\n💡 Validering för att förhindra delning:')
    console.log('========================================')
    console.log(`
// Lägg till denna validering i orchestra creation endpoint:

const existingWithSameDb = await prisma.orchestra.findFirst({
  where: { 
    databaseUrl: newDatabaseUrl,
    id: { not: orchestraId } // Exkludera sig själv vid uppdatering
  }
})

if (existingWithSameDb) {
  throw new Error(
    \`Databas används redan av \${existingWithSameDb.name}! \` +
    'Varje orkester MÅSTE ha sin egen databas.'
  )
}
    `)
    
  } catch (error) {
    console.error('Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabaseIsolation()