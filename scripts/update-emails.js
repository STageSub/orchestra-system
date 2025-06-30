#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEmails() {
  console.log('Updating all musician emails to @stagesubtest.com...');
  
  try {
    const musicians = await prisma.musician.findMany();
    
    let updated = 0;
    for (const musician of musicians) {
      const cleanFirst = musician.firstName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a]);
      const cleanLast = musician.lastName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a]);
      const newEmail = `${cleanFirst}.${cleanLast}@stagesubtest.com`;
      
      await prisma.musician.update({
        where: { id: musician.id },
        data: { email: newEmail }
      });
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`  Updated ${updated} emails...`);
      }
    }
    
    console.log(`✅ Updated ${updated} musician emails to @stagesubtest.com`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmails();