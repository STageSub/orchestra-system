import { prisma } from '@/lib/prisma'
import { writeFileSync } from 'fs'

async function exportMainTables() {
  console.log('📤 Exporterar Orchestra & User tabeller...\n')
  
  try {
    // Hämta alla orkestrar
    const orchestras = await prisma.orchestra.findMany()
    console.log(`✅ Hittade ${orchestras.length} orkestrar`)
    
    // Hämta alla användare
    const users = await prisma.user.findMany()
    console.log(`✅ Hittade ${users.length} användare`)
    
    // Skapa export-objekt
    const exportData = {
      exportDate: new Date().toISOString(),
      orchestras,
      users
    }
    
    // Spara till fil
    const filename = `main-tables-export-${Date.now()}.json`
    writeFileSync(filename, JSON.stringify(exportData, null, 2))
    
    console.log(`\n✅ Data exporterad till: ${filename}`)
    
    // Visa översikt
    console.log('\n📊 Exporterad data:')
    console.log('===================')
    
    console.log('\nOrkestrar:')
    orchestras.forEach(o => {
      console.log(`- ${o.name} (${o.subdomain})`)
    })
    
    console.log('\nAnvändare:')
    users.forEach(u => {
      console.log(`- ${u.username} (${u.role}) - Orkester: ${u.orchestraId || 'Ingen'}`)
    })
    
  } catch (error) {
    console.error('❌ Export misslyckades:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportMainTables()