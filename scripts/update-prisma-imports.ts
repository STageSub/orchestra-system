#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

const API_DIR = path.join(process.cwd(), 'app/api')

async function updateFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Skip if already using prismaMultitenant
    if (content.includes('prismaMultitenant')) {
      console.log(`✓ Already updated: ${filePath}`)
      return false
    }
    
    // Skip if it's a superadmin or auth route
    if (filePath.includes('/superadmin/') || filePath.includes('/auth/')) {
      console.log(`⊘ Skipping protected route: ${filePath}`)
      return false
    }
    
    // Replace import statement
    let updatedContent = content.replace(
      /import\s+{\s*prisma\s*}\s+from\s+['"]@\/lib\/prisma['"];?/g,
      "import { prismaMultitenant } from '@/lib/prisma-multitenant'"
    )
    
    // Replace all prisma. with prismaMultitenant.
    updatedContent = updatedContent.replace(/\bprisma\./g, 'prismaMultitenant.')
    
    // Write back only if changes were made
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent, 'utf-8')
      console.log(`✓ Updated: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error)
    return false
  }
}

async function findAllApiRoutes(dir: string): Promise<string[]> {
  const files: string[] = []
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath)
      }
    }
  }
  
  await walk(dir)
  return files
}

async function main() {
  console.log('🔄 Updating API routes to use prismaMultitenant...\n')
  
  const files = await findAllApiRoutes(API_DIR)
  const relevantFiles = files.filter(f => !f.includes('/superadmin/') && !f.includes('/auth/'))
  
  console.log(`Found ${relevantFiles.length} API route files to check\n`)
  
  let updatedCount = 0
  
  for (const file of relevantFiles) {
    const updated = await updateFile(file)
    if (updated) updatedCount++
  }
  
  console.log(`\n✅ Updated ${updatedCount} files`)
  console.log(`📊 ${relevantFiles.length - updatedCount} files were already updated or skipped`)
}

main().catch(console.error)