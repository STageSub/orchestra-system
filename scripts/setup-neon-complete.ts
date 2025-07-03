import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

async function setupNeonComplete() {
  console.log('🚀 Sätter upp Neon huvuddatabas komplett...\n')
  
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    // 1. Skapa tabeller med raw SQL
    console.log('📦 Skapar tabeller...')
    const sql = readFileSync('scripts/create-main-tables-neon.sql', 'utf-8')
    const statements = sql.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await neonPrisma.$executeRawUnsafe(statement)
          console.log('✅ Körde SQL-statement')
        } catch (error) {
          console.log('⚠️  Statement redan kört eller fel:', error.message.split('\n')[0])
        }
      }
    }
    
    // 2. Läs exporterad data
    console.log('\n📥 Läser exporterad data...')
    const exportFiles = [
      'main-tables-export-1751554354027.json',
      // Lägg till andra exportfiler här om de finns
    ]
    
    let exportData = null
    for (const file of exportFiles) {
      try {
        exportData = JSON.parse(readFileSync(file, 'utf-8'))
        console.log(`✅ Hittade exportfil: ${file}`)
        break
      } catch {
        // Försök nästa fil
      }
    }
    
    if (!exportData) {
      console.error('❌ Ingen exportfil hittades!')
      console.error('Kör först: npx tsx scripts/export-main-tables.ts')
      return
    }
    
    // 3. Importera data
    console.log('\n📝 Importerar data...')
    
    // Importera orkestrar
    for (const orchestra of exportData.orchestras) {
      try {
        await neonPrisma.orchestra.upsert({
          where: { id: orchestra.id },
          update: {},
          create: {
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
        console.log(`✅ ${orchestra.name} (${orchestra.subdomain})`)
      } catch (error) {
        console.error(`❌ Fel med ${orchestra.name}:`, error.message)
      }
    }
    
    // Importera användare
    console.log('\n👥 Importerar användare...')
    for (const user of exportData.users) {
      try {
        await neonPrisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: {
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
        console.log(`✅ ${user.username} (${user.role})`)
      } catch (error) {
        console.error(`❌ Fel med ${user.username}:`, error.message)
      }
    }
    
    // 4. Verifiera
    console.log('\n🔍 Verifierar...')
    const orchestras = await neonPrisma.orchestra.findMany()
    const users = await neonPrisma.user.findMany()
    
    console.log(`\n✅ Neon huvuddatabas innehåller:`)
    console.log(`   ${orchestras.length} orkestrar`)
    console.log(`   ${users.length} användare`)
    
    console.log('\n📊 Detaljer:')
    console.log('\nOrkestrar:')
    orchestras.forEach(o => {
      const dbProject = o.databaseUrl?.match(/postgres\.(\w+):/)?.[1]
      console.log(`- ${o.name} (${o.subdomain}) → Databas: ${dbProject}`)
    })
    
    console.log('\nAnvändare:')
    users.forEach(u => {
      console.log(`- ${u.username} (${u.role})`)
    })
    
    console.log('\n🎉 Klar! Nästa steg:')
    console.log('1. Kör SQL för att ta bort Orchestra & User från SCO-databasen:')
    console.log('   DROP TABLE IF EXISTS "User" CASCADE;')
    console.log('   DROP TABLE IF EXISTS "Orchestra" CASCADE;')
    console.log('2. Starta om servern: npm run dev')
    console.log('3. Testa inloggning!')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

setupNeonComplete()