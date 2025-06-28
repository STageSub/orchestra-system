// Script to verify database connection and schema
const { PrismaClient } = require('@prisma/client');

async function verifyDatabase() {
  console.log('Verifying database connection...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Check tables exist
    console.log('Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Found tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Count records in key tables
    console.log('\nChecking record counts:');
    const musicians = await prisma.musician.count();
    console.log(`  Musicians: ${musicians}`);
    
    const instruments = await prisma.instrument.count();
    console.log(`  Instruments: ${instruments}`);
    
    const projects = await prisma.project.count();
    console.log(`  Projects: ${projects}`);
    
    const templates = await prisma.emailTemplate.count();
    console.log(`  Email Templates: ${templates}`);

    // Check for required settings
    const settings = await prisma.settings.findMany();
    console.log(`  Settings: ${settings.length}`);

    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    console.error('\nError details:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n⚠️  Cannot reach database server. Check your DATABASE_URL.');
    } else if (error.code === 'P1002') {
      console.error('\n⚠️  Database server was reached but timed out.');
    } else if (error.code === 'P1003') {
      console.error('\n⚠️  Database does not exist.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyDatabase();