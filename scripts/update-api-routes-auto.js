#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Script to automatically update API routes to use subdomain-aware Prisma client
 * 
 * Usage: node scripts/update-api-routes-auto.js [--dry-run]
 */

const UPDATE_PATTERNS = {
  // Import replacement
  importPrisma: {
    from: /import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/prisma['"]/g,
    to: "import { getPrismaForRequest } from '@/lib/prisma-subdomain'"
  },
  
  // GET function without request parameter
  getWithoutRequest: {
    from: /export\s+async\s+function\s+GET\s*\(\s*\)\s*{/g,
    to: 'export async function GET(request: Request) {'
  },
  
  // Add prisma client at start of function
  addPrismaClient: {
    // This is more complex, handled separately
  },
  
  // Update generateUniqueId calls
  generateUniqueId: {
    from: /await\s+generateUniqueId\s*\(\s*['"](\w+)['"]\s*\)/g,
    to: "await generateUniqueId('$1', prisma)"
  }
};

// Files to skip
const SKIP_FILES = [
  'route.ts.bak',
  'test/',
  '.next/',
  'node_modules/',
  '/api/respond/route.ts', // Special handling needed
  '/api/superadmin/', // May need multi-DB access
];

// Track changes
const stats = {
  filesScanned: 0,
  filesUpdated: 0,
  errors: [],
  skipped: []
};

async function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

async function updateFile(filePath, isDryRun) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Check if file imports from @/lib/prisma
    if (!content.includes("from '@/lib/prisma'")) {
      return false;
    }
    
    // Skip if already updated
    if (content.includes("from '@/lib/prisma-subdomain'")) {
      stats.skipped.push(filePath);
      return false;
    }
    
    console.log(`\nProcessing: ${filePath}`);
    
    // 1. Update import
    if (UPDATE_PATTERNS.importPrisma.from.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        UPDATE_PATTERNS.importPrisma.from,
        UPDATE_PATTERNS.importPrisma.to
      );
      hasChanges = true;
      console.log('  ✓ Updated import');
    }
    
    // 2. Update GET function signature
    if (UPDATE_PATTERNS.getWithoutRequest.from.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        UPDATE_PATTERNS.getWithoutRequest.from,
        UPDATE_PATTERNS.getWithoutRequest.to
      );
      hasChanges = true;
      console.log('  ✓ Updated GET signature');
    }
    
    // 3. Add prisma client after function declarations
    const functionPatterns = [
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{\s*\n(\s*)try\s*{/g
    ];
    
    functionPatterns.forEach(pattern => {
      updatedContent = updatedContent.replace(pattern, (match, method, indent) => {
        // Check if prisma is already defined in the next few lines
        const nextLines = match + updatedContent.split(match)[1].substring(0, 200);
        if (nextLines.includes('getPrismaForRequest') || nextLines.includes('const prisma =')) {
          return match;
        }
        
        hasChanges = true;
        console.log(`  ✓ Added prisma client to ${method}`);
        return match + `\n${indent}  const prisma = await getPrismaForRequest(request)`;
      });
    });
    
    // 4. Update generateUniqueId calls
    if (UPDATE_PATTERNS.generateUniqueId.from.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        UPDATE_PATTERNS.generateUniqueId.from,
        UPDATE_PATTERNS.generateUniqueId.to
      );
      hasChanges = true;
      console.log('  ✓ Updated generateUniqueId calls');
    }
    
    // 5. Handle DELETE, PUT, PATCH without request parameter
    const otherMethods = ['DELETE', 'PUT', 'PATCH'];
    otherMethods.forEach(method => {
      const pattern = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*\\)\\s*{`, 'g');
      if (pattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(pattern, `export async function ${method}(request: Request) {`);
        hasChanges = true;
        console.log(`  ✓ Updated ${method} signature`);
      }
    });
    
    if (hasChanges) {
      if (!isDryRun) {
        // Backup original file
        await fs.writeFile(filePath + '.bak', content);
        // Write updated content
        await fs.writeFile(filePath, updatedContent);
        console.log('  ✓ File updated');
      } else {
        console.log('  → Would update file (dry run)');
      }
      stats.filesUpdated++;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    stats.errors.push({ file: filePath, error: error.message });
    return false;
  }
}

async function findApiRoutes(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('=== API Routes Update Script ===\n');
  if (isDryRun) {
    console.log('Running in DRY RUN mode - no files will be modified\n');
  }
  
  const apiDir = path.join(process.cwd(), 'app', 'api');
  console.log(`Scanning for API routes in: ${apiDir}\n`);
  
  try {
    const files = await findApiRoutes(apiDir);
    console.log(`Found ${files.length} route files\n`);
    
    for (const file of files) {
      stats.filesScanned++;
      
      if (await shouldSkipFile(file)) {
        console.log(`Skipping: ${file}`);
        stats.skipped.push(file);
        continue;
      }
      
      await updateFile(file, isDryRun);
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Files scanned: ${stats.filesScanned}`);
    console.log(`Files updated: ${stats.filesUpdated}`);
    console.log(`Files skipped: ${stats.skipped.length}`);
    console.log(`Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach(err => {
        console.log(`  ${err.file}: ${err.error}`);
      });
    }
    
    if (!isDryRun && stats.filesUpdated > 0) {
      console.log('\n✓ Updates complete!');
      console.log('Backup files created with .bak extension');
      console.log('\nNext steps:');
      console.log('1. Review the changes');
      console.log('2. Test the updated routes');
      console.log('3. Remove .bak files when satisfied');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);