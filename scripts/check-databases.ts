import { prisma } from '@/lib/prisma'

async function checkDatabases() {
  const orchestras = await prisma.orchestra.findMany({
    select: {
      name: true,
      subdomain: true,
      databaseUrl: true,
      status: true
    }
  })
  
  console.log('Orkestrar och deras databaser:')
  console.log('================================')
  
  const databaseMap = new Map<string, string[]>()
  
  for (const orch of orchestras) {
    console.log(`\n${orch.name} (${orch.subdomain})`)
    console.log(`Status: ${orch.status}`)
    
    if (orch.databaseUrl) {
      // Hide password in URL for security
      const url = orch.databaseUrl.replace(/:([^@]+)@/, ':****@')
      console.log(`Database: ${url}`)
      
      // Group orchestras by database
      const dbHost = orch.databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'
      if (!databaseMap.has(dbHost)) {
        databaseMap.set(dbHost, [])
      }
      databaseMap.get(dbHost)!.push(orch.subdomain)
    } else {
      console.log('Database: INGEN')
    }
  }
  
  console.log('\n\nDatabaser som delas:')
  console.log('====================')
  
  for (const [db, orchestras] of databaseMap) {
    if (orchestras.length > 1) {
      console.log(`\n⚠️  ${db} används av:`)
      orchestras.forEach(o => console.log(`   - ${o}`))
    }
  }
  
  await prisma.$disconnect()
}

checkDatabases()