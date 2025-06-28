require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  console.log('🚀 Starting Supabase data export...\n');
  
  try {
    // Create exports directory
    const exportDir = path.join(__dirname, '../exports');
    await fs.mkdir(exportDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export all tables
    const tables = [
      'musician',
      'instrument', 
      'position',
      'musicianQualification',
      'rankingList',
      'ranking',
      'project',
      'projectNeed',
      'request',
      'requestToken',
      'emailTemplate',
      'communicationLog',
      'projectFile',
      'idSequence',
      'deletedIds',
      'settings'
    ];
    
    const exportData = {};
    
    for (const table of tables) {
      console.log(`📦 Exporting ${table}...`);
      try {
        exportData[table] = await prisma[table].findMany();
        console.log(`   ✅ Exported ${exportData[table].length} records from ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Skipping ${table}: ${error.message}`);
      }
    }
    
    // Save to JSON file
    const filename = `supabase-export-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📄 Saved to: ${filepath}`);
    console.log(`📊 Total size: ${(await fs.stat(filepath)).size / 1024 / 1024} MB`);
    
    // Also create a schema-only export for Prisma
    const schemaExport = {
      schema: await prisma.$queryRaw`
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `
    };
    
    const schemaFile = path.join(exportDir, `schema-${timestamp}.json`);
    await fs.writeFile(schemaFile, JSON.stringify(schemaExport, null, 2));
    console.log(`📋 Schema saved to: ${schemaFile}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();