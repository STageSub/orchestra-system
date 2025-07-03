import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

async function updateFiles() {
  console.log('🔄 Uppdaterar API routes till användarbaserad databaskoppling...')
  
  // Find all TypeScript files in api directory
  const files = await glob('app/api/**/*.ts', {
    ignore: ['**/superadmin/**', '**/auth/**', '**/respond/**']
  })
  
  let updatedCount = 0
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    // Check if file uses getPrismaForRequest
    if (content.includes('getPrismaForRequest')) {
      // Update import
      let newContent = content.replace(
        "import { getPrismaForRequest } from '@/lib/prisma-subdomain'",
        "import { getPrismaForUser } from '@/lib/auth-prisma'"
      )
      
      // Update function calls
      newContent = newContent.replace(/getPrismaForRequest/g, 'getPrismaForUser')
      
      // Write back
      fs.writeFileSync(file, newContent, 'utf-8')
      console.log(`✅ Updated: ${file}`)
      updatedCount++
    }
  }
  
  console.log(`\n✨ Uppdaterade ${updatedCount} filer!`)
  console.log('\n📝 Nästa steg:')
  console.log('1. Starta om utvecklingsservern')
  console.log('2. Testa med olika användare på localhost:3000')
  console.log('3. Varje användare ska nu se sin egen databas!')
}

updateFiles().catch(console.error)