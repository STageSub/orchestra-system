require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  console.log('🚀 Starting import to Neon...\n');
  
  try {
    // Find the latest export file
    const exportDir = path.join(__dirname, '../exports');
    const files = await fs.readdir(exportDir);
    const exportFile = files.find(f => f.startsWith('supabase-export-') && f.endsWith('.json'));
    
    if (!exportFile) {
      throw new Error('No export file found!');
    }
    
    const filepath = path.join(exportDir, exportFile);
    console.log(`📄 Reading from: ${exportFile}`);
    
    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
    
    // Import in correct order to respect foreign keys
    const importOrder = [
      'instrument',
      'position',
      'musician',
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
      'settings'
    ];
    
    for (const table of importOrder) {
      if (data[table] && data[table].length > 0) {
        console.log(`\n📦 Importing ${table}...`);
        
        try {
          // Handle different tables with their specific create methods
          if (table === 'musicianQualification' || table === 'ranking') {
            // These use createMany without data wrapper
            await prisma[table].createMany({
              data: data[table],
              skipDuplicates: true
            });
          } else {
            // Regular create for each record
            for (const record of data[table]) {
              await prisma[table].create({ data: record });
            }
          }
          
          console.log(`   ✅ Imported ${data[table].length} records to ${table}`);
        } catch (error) {
          console.log(`   ⚠️  Error importing ${table}:`, error.message);
          // Continue with other tables
        }
      }
    }
    
    // Verify import
    console.log('\n📊 Verifying import...');
    const counts = {
      musicians: await prisma.musician.count(),
      instruments: await prisma.instrument.count(),
      positions: await prisma.position.count(),
      projects: await prisma.project.count(),
      rankings: await prisma.ranking.count()
    };
    
    console.log('✅ Import completed!');
    console.log('📈 Database now contains:');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();