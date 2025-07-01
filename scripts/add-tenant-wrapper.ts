#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

const API_DIR = path.join(process.cwd(), 'app/api')

async function shouldWrapRoute(filePath: string): Promise<boolean> {
  // Skip these paths
  if (filePath.includes('/superadmin/') || 
      filePath.includes('/auth/') || 
      filePath.includes('/respond/') ||
      filePath.includes('/health/') ||
      filePath.includes('/logs/') ||
      filePath.includes('/cron/')) {
    return false
  }
  
  const content = await fs.readFile(filePath, 'utf-8')
  
  // Skip if already using withTenant
  if (content.includes('withTenant')) {
    return false
  }
  
  // Check if it has API routes
  return content.includes('export async function GET') ||
         content.includes('export async function POST') ||
         content.includes('export async function PUT') ||
         content.includes('export async function DELETE') ||
         content.includes('export async function PATCH')
}

async function wrapRoute(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Add import if not present
    let updatedContent = content
    if (!content.includes('import { withTenant }')) {
      // Add import after other imports
      const importMatch = content.match(/import.*from.*\n/g)
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1]
        const lastImportIndex = content.lastIndexOf(lastImport)
        updatedContent = content.slice(0, lastImportIndex + lastImport.length) +
          "import { withTenant } from '@/lib/api-utils'\n" +
          content.slice(lastImportIndex + lastImport.length)
      }
    }
    
    // Wrap each HTTP method
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    for (const method of methods) {
      const regex = new RegExp(`export async function ${method}\\(`, 'g')
      if (regex.test(updatedContent)) {
        // Simple approach: add withTenant wrapper
        updatedContent = updatedContent.replace(
          new RegExp(`export async function ${method}\\(`),
          `export const ${method} = withTenant(async function ${method}(`
        )
        
        // Find the end of the function and add closing parenthesis
        // This is a simplified approach - in practice, you'd need more sophisticated parsing
        const functionStart = updatedContent.indexOf(`export const ${method} = withTenant(async function ${method}(`)
        if (functionStart !== -1) {
          let braceCount = 0
          let inString = false
          let stringChar = ''
          let i = functionStart
          
          // Skip to the opening brace
          while (i < updatedContent.length && updatedContent[i] !== '{') i++
          
          // Count braces to find the end
          for (; i < updatedContent.length; i++) {
            const char = updatedContent[i]
            
            if (!inString) {
              if (char === '"' || char === "'" || char === '`') {
                inString = true
                stringChar = char
              } else if (char === '{') {
                braceCount++
              } else if (char === '}') {
                braceCount--
                if (braceCount === 0) {
                  // Found the end of the function
                  updatedContent = updatedContent.slice(0, i + 1) + ')' + updatedContent.slice(i + 1)
                  break
                }
              }
            } else {
              if (char === stringChar && updatedContent[i - 1] !== '\\\\') {
                inString = false
              }
            }
          }
        }
      }
    }
    
    await fs.writeFile(filePath, updatedContent, 'utf-8')
    console.log(`✓ Wrapped: ${filePath}`)
    return true
  } catch (error) {
    console.error(`✗ Error wrapping ${filePath}:`, error)
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
  console.log('🔄 Adding tenant wrapper to API routes...\n')
  console.log('Note: This is a complex operation. Manual review recommended!\n')
  
  const files = await findAllApiRoutes(API_DIR)
  console.log(`Found ${files.length} API route files\n`)
  
  let wrappedCount = 0
  let skippedCount = 0
  
  for (const file of files) {
    if (await shouldWrapRoute(file)) {
      console.log(`\nProcessing: ${file}`)
      console.log('⚠️  Manual wrapping recommended for complex routes')
      skippedCount++
    } else {
      skippedCount++
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`Wrapped: ${wrappedCount} files`)
  console.log(`Skipped: ${skippedCount} files`)
  console.log(`\n⚠️  Due to complexity, manual wrapping is recommended for API routes.`)
  console.log(`Use the withTenant wrapper from '@/lib/api-utils' for tenant isolation.`)
}

main().catch(console.error)