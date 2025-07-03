import { prisma } from '@/lib/prisma'

interface IsolationIssue {
  database: string
  orchestras: string[]
  severity: 'CRITICAL' | 'WARNING'
}

async function monitorDatabaseIsolation() {
  const startTime = new Date()
  console.log(`🔍 Database Isolation Monitor`)
  console.log(`📅 ${startTime.toLocaleString('sv-SE')}\n`)
  
  try {
    // Hämta alla orkestrar
    const orchestras = await prisma.orchestra.findMany({
      where: { status: 'active' },
      select: {
        name: true,
        subdomain: true,
        databaseUrl: true,
        status: true
      }
    })
    
    // Gruppera orkestrar per databas
    const databaseMap = new Map<string, string[]>()
    
    for (const orch of orchestras) {
      if (orch.databaseUrl) {
        // Extrahera projekt-ID som unik identifierare
        const projectId = orch.databaseUrl.match(/postgres\.(\w+):/)?.[1] || 'unknown'
        
        if (!databaseMap.has(projectId)) {
          databaseMap.set(projectId, [])
        }
        databaseMap.get(projectId)!.push(orch.name)
      }
    }
    
    // Analysera resultat
    const issues: IsolationIssue[] = []
    let isolatedCount = 0
    
    for (const [db, orchNames] of databaseMap) {
      if (orchNames.length > 1) {
        issues.push({
          database: db,
          orchestras: orchNames,
          severity: 'CRITICAL'
        })
      } else {
        isolatedCount++
      }
    }
    
    // Rapportera status
    console.log('📊 Status Sammanfattning:')
    console.log('========================')
    console.log(`✅ Isolerade orkestrar: ${isolatedCount}`)
    console.log(`❌ Databasisolering bruten: ${issues.length}`)
    console.log(`📈 Total antal orkestrar: ${orchestras.length}`)
    
    if (issues.length > 0) {
      console.log('\n🚨 KRITISKA PROBLEM:')
      console.log('===================')
      
      for (const issue of issues) {
        console.log(`\n❌ Databas ${issue.database} delas av:`)
        issue.orchestras.forEach(o => console.log(`   - ${o}`))
        console.log(`   Severity: ${issue.severity}`)
        console.log('   Åtgärd: Dessa orkestrar MÅSTE få separata databaser!')
      }
      
      // Skapa automatisk rapport
      const report = {
        timestamp: startTime.toISOString(),
        issues: issues,
        summary: {
          totalOrchestras: orchestras.length,
          isolatedOrchestras: isolatedCount,
          sharedDatabases: issues.length,
          affectedOrchestras: issues.reduce((sum, issue) => sum + issue.orchestras.length, 0)
        }
      }
      
      // Spara rapport (kan skickas till logging-system)
      console.log('\n📄 JSON Rapport:')
      console.log(JSON.stringify(report, null, 2))
      
      // Returnera fel-status för CI/CD
      process.exit(1)
    } else {
      console.log('\n✅ Alla orkestrar har sina egna databaser!')
      console.log('🔒 100% databasisolering uppnådd.')
    }
    
  } catch (error) {
    console.error('❌ Monitor fel:', error)
    process.exit(2)
  } finally {
    await prisma.$disconnect()
  }
}

// Kör om detta är huvudfilen
if (require.main === module) {
  monitorDatabaseIsolation()
}

export { monitorDatabaseIsolation, IsolationIssue }