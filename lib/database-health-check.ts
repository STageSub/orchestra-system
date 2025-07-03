import { PrismaClient } from '@prisma/client'

export interface DatabaseHealthCheckResult {
  healthy: boolean
  connectionOk: boolean
  isEmpty: boolean
  isolated: boolean
  details: {
    canConnect: boolean
    tableCount: number
    recordCounts: {
      musicians: number
      projects: number
      requests: number
    }
    error?: string
  }
}

/**
 * Kontrollera att en databas är frisk och redo för användning
 * Detta körs efter att en ny databas skapats för att verifiera isolation
 */
export async function checkDatabaseHealth(
  databaseUrl: string,
  orchestraSubdomain: string
): Promise<DatabaseHealthCheckResult> {
  console.log(`🏥 Kör hälsokontroll för databas (${orchestraSubdomain})...`)
  
  const result: DatabaseHealthCheckResult = {
    healthy: false,
    connectionOk: false,
    isEmpty: false,
    isolated: false,
    details: {
      canConnect: false,
      tableCount: 0,
      recordCounts: {
        musicians: 0,
        projects: 0,
        requests: 0
      }
    }
  }
  
  const testPrisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  })
  
  try {
    // 1. Testa anslutning
    console.log('1️⃣ Testar anslutning...')
    await testPrisma.$connect()
    result.connectionOk = true
    result.details.canConnect = true
    console.log('   ✅ Anslutning fungerar')
    
    // 2. Kontrollera att databasen är tom (för nya orkestrar)
    console.log('2️⃣ Kontrollerar databas-innehåll...')
    
    const [musicianCount, projectCount, requestCount] = await Promise.all([
      testPrisma.musician.count(),
      testPrisma.project.count(),
      testPrisma.request.count()
    ])
    
    result.details.recordCounts = {
      musicians: musicianCount,
      projects: projectCount,
      requests: requestCount
    }
    
    // För en ny databas ska allt vara 0
    result.isEmpty = musicianCount === 0 && projectCount === 0 && requestCount === 0
    
    if (result.isEmpty) {
      console.log('   ✅ Databasen är tom (som förväntat för ny orkester)')
    } else {
      console.log(`   ⚠️  Databasen innehåller data: ${musicianCount} musiker, ${projectCount} projekt`)
    }
    
    // 3. Verifiera isolation genom att skapa test-data
    console.log('3️⃣ Verifierar isolation...')
    
    const testId = `HEALTH-CHECK-${Date.now()}`
    const testMusician = await testPrisma.musician.create({
      data: {
        musicianId: testId,
        firstName: 'Health',
        lastName: 'Check',
        email: `health.check.${Date.now()}@test.com`
      }
    })
    
    // Omedelbart radera test-data
    await testPrisma.musician.delete({
      where: { id: testMusician.id }
    })
    
    result.isolated = true
    console.log('   ✅ Databasisolation verifierad')
    
    // 4. Slutlig bedömning
    result.healthy = result.connectionOk && result.isolated
    
    if (result.healthy) {
      console.log('✅ Databasen är frisk och redo för användning!')
    } else {
      console.log('❌ Databasen har problem')
    }
    
  } catch (error) {
    console.error('❌ Hälsokontroll misslyckades:', error)
    result.details.error = error instanceof Error ? error.message : 'Okänt fel'
  } finally {
    await testPrisma.$disconnect()
  }
  
  return result
}

/**
 * Verifiera att ingen annan orkester kan komma åt denna databas
 */
export async function verifyDatabaseIsolation(
  databaseUrl: string,
  expectedOrchestra: string,
  otherOrchestras: { subdomain: string; databaseUrl: string | null }[]
): Promise<boolean> {
  console.log(`🔒 Verifierar att ${expectedOrchestra} har exklusiv åtkomst...`)
  
  // Kontrollera att ingen annan orkester har samma databas-URL
  for (const other of otherOrchestras) {
    if (other.subdomain === expectedOrchestra) continue
    
    if (other.databaseUrl === databaseUrl) {
      console.error(`❌ KRITISKT: ${other.subdomain} har samma databas-URL!`)
      return false
    }
  }
  
  console.log('✅ Ingen annan orkester har åtkomst till denna databas')
  return true
}

/**
 * Formatera hälsokontroll-resultat för loggning
 */
export function formatHealthCheckResult(result: DatabaseHealthCheckResult): string {
  let output = '\n🏥 Databas Hälsorapport\n'
  output += '=======================\n'
  
  output += `Anslutning: ${result.connectionOk ? '✅ OK' : '❌ Fel'}\n`
  output += `Tom databas: ${result.isEmpty ? '✅ Ja' : '⚠️  Innehåller data'}\n`
  output += `Isolerad: ${result.isolated ? '✅ Ja' : '❌ Nej'}\n`
  
  if (!result.isEmpty) {
    output += `\nDatainnehåll:\n`
    output += `  Musiker: ${result.details.recordCounts.musicians}\n`
    output += `  Projekt: ${result.details.recordCounts.projects}\n`
    output += `  Förfrågningar: ${result.details.recordCounts.requests}\n`
  }
  
  if (result.details.error) {
    output += `\nFel: ${result.details.error}\n`
  }
  
  output += `\nSlutsats: ${result.healthy ? '✅ Frisk databas' : '❌ Problem upptäckta'}\n`
  
  return output
}