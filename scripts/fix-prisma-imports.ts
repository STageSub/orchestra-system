import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'

async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await findTsFiles(fullPath))
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  
  return files
}

async function fixPrismaImports() {
  console.log('🔧 Fixing Prisma imports to use auth-based database selection...\n')
  
  // Find all TypeScript files in app/api
  const files = await findTsFiles('app/api')
  
  let updatedCount = 0
  
  for (const file of files) {
    try {
      let content = await readFile(file, 'utf-8')
      let updated = false
      
      // Check if file uses getPrismaForRequest
      if (content.includes('getPrismaForRequest')) {
        // Replace import
        content = content.replace(
          "import { getPrismaForRequest } from '@/lib/prisma-subdomain'",
          "import { getPrismaForUser } from '@/lib/auth-prisma'"
        )
        
        // Replace function calls
        content = content.replace(
          /getPrismaForRequest\(/g,
          'getPrismaForUser('
        )
        
        updated = true
      }
      
      // Check if file uses direct prisma import from lib/prisma
      if (content.includes("from '@/lib/prisma'") && !content.includes('generateUniqueId')) {
        // This is trickier - need to check context
        console.log(`⚠️  ${file} uses direct prisma import - needs manual review`)
      }
      
      if (updated) {
        await writeFile(file, content)
        console.log(`✅ Updated: ${file}`)
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }
  
  console.log(`\n📊 Summary: Updated ${updatedCount} files`)
  console.log('\n⚠️  Remember to restart the development server after these changes!')
}

fixPrismaImports()