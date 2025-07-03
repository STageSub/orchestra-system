import { prisma } from '@/lib/prisma'

async function checkDatabaseStructure() {
  console.log('🔍 Kontrollerar databasstruktur...\n')
  
  // Visa huvuddatabasen
  console.log('HUVUDDATABAS (Central):')
  console.log('=======================')
  console.log('URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@'))
  
  // Hämta orkestrar
  const orchestras = await prisma.orchestra.findMany({
    select: {
      name: true,
      subdomain: true,
      databaseUrl: true
    }
  })
  
  console.log('\nORKESTRAR OCH DERAS DATABASER:')
  console.log('================================')
  
  // Jämför databas-URLer
  const mainDbProject = process.env.DATABASE_URL?.match(/postgres\.(\w+):/)?.[1]
  console.log(`\nHuvuddatabas projekt-ID: ${mainDbProject}`)
  
  for (const orch of orchestras) {
    const orchDbProject = orch.databaseUrl?.match(/postgres\.(\w+):/)?.[1]
    console.log(`\n${orch.name} (${orch.subdomain}):`)
    console.log(`  Projekt-ID: ${orchDbProject}`)
    
    if (orchDbProject === mainDbProject) {
      console.log('  ⚠️  VARNING: Använder SAMMA databas som huvuddatabasen!')
      console.log('  Detta förklarar varför Orchestra-tabellen syns där.')
    } else {
      console.log('  ✅ Har sin egen separata databas')
    }
  }
  
  console.log('\n\nSAMMANFATTNING:')
  console.log('===============')
  console.log('Det SKA finnas 3 separata databaser:')
  console.log('1. Huvuddatabas (för Orchestra & User tabeller)')
  console.log('2. SCO databas (bara SCO:s data)')
  console.log('3. SCOSO databas (bara SCOSO:s data)')
  
  await prisma.$disconnect()
}

checkDatabaseStructure()