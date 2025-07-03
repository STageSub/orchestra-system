import { PrismaClient } from '@prisma/client'

async function resetAndSetupOrchestra() {
  const databaseUrl = process.argv[2]
  const orchestraName = process.argv[3] || 'Orchestra'
  const subdomain = process.argv[4]
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL krävs')
    console.error('Användning: npx tsx scripts/reset-and-setup-orchestra.ts "postgresql://..." "Orchestra Name" "subdomain"')
    process.exit(1)
  }

  console.log('🔄 Återställer och sätter upp orkesterdatabas...')
  console.log(`📊 Orchestra: ${orchestraName}`)
  console.log(`🌐 Subdomain: ${subdomain || 'N/A'}`)

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    // 1. Rensa all befintlig data
    console.log('\n🗑️  Rensar befintlig data...')
    await prisma.$transaction([
      prisma.communicationLog.deleteMany(),
      prisma.requestToken.deleteMany(),
      prisma.request.deleteMany(),
      prisma.ranking.deleteMany(),
      prisma.projectFile.deleteMany(),
      prisma.projectNeed.deleteMany(),
      prisma.project.deleteMany(),
      prisma.rankingList.deleteMany(),
      prisma.musicianQualification.deleteMany(),
      prisma.position.deleteMany(),
      prisma.instrument.deleteMany(),
      prisma.musician.deleteMany(),
      prisma.emailTemplate.deleteMany(),
    ])
    console.log('✓ All data rensad')

    // 2. Kör setup-scriptet
    console.log('\n🚀 Kör komplett setup...')
    const { setupOrchestraComplete } = await import('./setup-orchestra-complete')
    
    // Mock process.argv för setup-scriptet
    const originalArgv = process.argv
    process.argv = ['node', 'setup-orchestra-complete.ts', databaseUrl, orchestraName, subdomain]
    
    await setupOrchestraComplete()
    
    // Återställ process.argv
    process.argv = originalArgv
    
    console.log('\n✅ Orkesterdatabas helt återställd och uppsatt!')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Kör om detta är huvudfilen
if (require.main === module) {
  resetAndSetupOrchestra()
}