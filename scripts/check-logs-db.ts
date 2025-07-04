import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkLogs() {
  console.log('🔍 Checking SystemLog table in Neon database...\n');
  
  try {
    // Count total logs
    const totalCount = await prisma.systemLog.count();
    console.log(`📊 Total logs in database: ${totalCount}`);
    
    // Get latest logs
    const latestLogs = await prisma.systemLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });
    
    if (latestLogs.length > 0) {
      console.log('\n📋 Latest 10 logs:');
      console.log('━'.repeat(80));
      
      latestLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. [${log.level.toUpperCase()}] [${log.category}] ${log.message}`);
        console.log(`   Time: ${log.timestamp}`);
        if (log.userId) console.log(`   User: ${log.userId}`);
        if (log.orchestraId) console.log(`   Orchestra: ${log.orchestraId}`);
        if (log.metadata) console.log(`   Metadata: ${JSON.stringify(log.metadata)}`);
      });
    } else {
      console.log('\n⚠️  No logs found in the database');
    }
    
    // Check if logs page would see these
    console.log('\n\n🔍 Testing logs page query...');
    const pageQuery = await prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      skip: 0
    });
    
    console.log(`✅ Logs page query would return ${pageQuery.length} logs`);
    
    // Group by level
    const levels = await prisma.systemLog.groupBy({
      by: ['level'],
      _count: true
    });
    
    console.log('\n📊 Logs by level:');
    levels.forEach(level => {
      console.log(`   ${level.level}: ${level._count}`);
    });
    
    // Group by category
    const categories = await prisma.systemLog.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📊 Logs by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();