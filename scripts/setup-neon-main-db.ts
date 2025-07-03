import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

async function setupNeonMainDb() {
  console.log('🚀 Sätter upp Neon huvuddatabas...\n')
  
  // Använd Neon-databasen
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    // 1. Kör Prisma migrations för att skapa tabeller
    console.log('📦 Skapar tabeller i Neon...')
    console.log('Kör: npx prisma migrate deploy')
    console.log('(Detta måste köras manuellt först)\n')
    
    // Kontrollera om tabeller finns
    try {
      await neonPrisma.orchestra.count()
      console.log('✅ Orchestra tabell finns')
    } catch {
      console.log('❌ Orchestra tabell saknas - kör migrations först!')
      return
    }
    
    // 2. Läs exporterad data
    console.log('\n📥 Läser exporterad data...')
    const exportFile = process.argv[2]
    
    if (!exportFile) {
      console.error('❌ Ange export-fil som parameter')
      console.error('Exempel: npx tsx scripts/setup-neon-main-db.ts main-tables-export-XXX.json')
      return
    }
    
    const exportData = JSON.parse(readFileSync(exportFile, 'utf-8'))
    console.log(`✅ Läste ${exportData.orchestras.length} orkestrar och ${exportData.users.length} användare`)
    
    // 3. Importera Orchestra-data
    console.log('\n📝 Importerar orkestrar...')
    for (const orchestra of exportData.orchestras) {
      try {
        await neonPrisma.orchestra.create({
          data: {
            id: orchestra.id,
            name: orchestra.name,
            subdomain: orchestra.subdomain,
            contactName: orchestra.contactName,
            contactEmail: orchestra.contactEmail,
            databaseUrl: orchestra.databaseUrl,
            status: orchestra.status,
            createdAt: new Date(orchestra.createdAt),
            updatedAt: new Date(orchestra.updatedAt)
          }
        })
        console.log(`✅ Importerade: ${orchestra.name}`)
      } catch (error) {
        console.log(`⚠️  ${orchestra.name} finns redan`)
      }
    }
    
    // 4. Importera User-data
    console.log('\n👥 Importerar användare...')
    for (const user of exportData.users) {
      try {
        await neonPrisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            orchestraId: user.orchestraId,
            active: user.active,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        })
        console.log(`✅ Importerade: ${user.username} (${user.role})`)
      } catch (error) {
        console.log(`⚠️  ${user.username} finns redan`)
      }
    }
    
    // 5. Verifiera
    console.log('\n✅ Verifierar import...')
    const orchestraCount = await neonPrisma.orchestra.count()
    const userCount = await neonPrisma.user.count()
    
    console.log(`\n📊 Neon huvuddatabas innehåller nu:`)
    console.log(`   ${orchestraCount} orkestrar`)
    console.log(`   ${userCount} användare`)
    
    console.log('\n🎉 Klar! Nästa steg:')
    console.log('1. Ta bort Orchestra & User tabeller från SCO-databasen')
    console.log('2. Starta om servern')
    console.log('3. Testa inloggning')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

// Kör om detta är huvudfilen
if (require.main === module) {
  setupNeonMainDb()
}