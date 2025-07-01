#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

const API_DIR = path.join(process.cwd(), 'app/api')

async function updateRoute(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Skip if already has runWithTenant
    if (content.includes('runWithTenant')) {
      console.log(`✓ Already has context: ${filePath}`)
      return false
    }
    
    // Skip protected routes
    if (filePath.includes('/superadmin/') || 
        filePath.includes('/auth/') || 
        filePath.includes('/respond/') ||
        filePath.includes('/health/') ||
        filePath.includes('/logs/') ||
        filePath.includes('/cron/')) {
      console.log(`⊘ Skipping protected route: ${filePath}`)
      return false
    }
    
    // Check if it needs tenant context
    if (!content.includes('prismaMultitenant')) {
      console.log(`⊘ No prisma usage: ${filePath}`)
      return false
    }
    
    // Add import if not present
    let updatedContent = content
    if (!content.includes('import { runWithTenant }')) {
      // Find the first import or use the beginning
      const firstImportMatch = content.match(/^import.*from.*$/m)
      if (firstImportMatch) {
        const insertPos = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
        updatedContent = content.slice(0, insertPos) + 
          "\nimport { runWithTenant } from '@/lib/tenant-context'" + 
          content.slice(insertPos)
      } else {
        updatedContent = "import { runWithTenant } from '@/lib/tenant-context'\n" + content
      }
    }
    
    // For each HTTP method, wrap the body with runWithTenant
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    for (const method of methods) {
      // Find the function
      const functionRegex = new RegExp(`export async function ${method}\\s*\\([^)]*\\)\\s*{`, 'g')
      const match = functionRegex.exec(updatedContent)
      
      if (match) {
        const functionStart = match.index! + match[0].length
        
        // Extract tenant from request headers
        const tenantExtraction = `
  const tenantId = request.headers.get('x-tenant-id')
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
  }
  
  return runWithTenant(tenantId, async () => {`
        
        // Find the end of the function
        let braceCount = 1
        let i = functionStart
        let endPos = -1
        
        while (i < updatedContent.length && braceCount > 0) {
          if (updatedContent[i] === '{') braceCount++
          if (updatedContent[i] === '}') {
            braceCount--
            if (braceCount === 0) {
              endPos = i
              break
            }
          }
          i++
        }
        
        if (endPos !== -1) {
          // Insert the wrapper
          const functionBody = updatedContent.slice(functionStart, endPos)
          updatedContent = updatedContent.slice(0, functionStart) +
            tenantExtraction +
            functionBody +
            '\n  })' +
            updatedContent.slice(endPos)
        }
      }
    }
    
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
  console.log('🔄 Adding tenant context to API routes...\n')
  console.log('This will wrap API route handlers with runWithTenant\n')
  
  const files = await findAllApiRoutes(API_DIR)
  console.log(`Found ${files.length} API route files\n`)
  
  let updatedCount = 0
  
  // Process a few files manually first as examples
  const priorityFiles = [
    '/app/api/musicians/route.ts',
    '/app/api/projects/route.ts',
    '/app/api/instruments/route.ts'
  ].map(f => path.join(process.cwd(), f))
  
  console.log('Processing priority files first...\n')
  
  for (const file of files) {
    if (priorityFiles.includes(file)) {
      const updated = await updateRoute(file)
      if (updated) updatedCount++
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} files`)
  console.log(`\n📝 Manual review recommended for remaining files.`)
  console.log(`The prismaMultitenant middleware already handles tenant filtering automatically.`)
  console.log(`Additional wrapping with runWithTenant is only needed if you need explicit tenant context.`)
}

main().catch(console.error)