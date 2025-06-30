#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addArchivedMusicians() {
  console.log('🗄️  Adding archived musicians...')
  
  try {
    // Archive some existing musicians
    console.log('\n📦 Archiving existing musicians...')
    
    // Get some active musicians to archive (not substitutes)
    const musiciansToArchive = await prisma.musician.findMany({
      where: {
        isActive: true,
        isArchived: false,
        NOT: {
          lastName: { contains: '-vikarie' }
        }
      },
      take: 10,
      orderBy: { id: 'asc' }
    })
    
    // Archive them with different dates and reasons
    const archiveReasons = [
      { months: 24, reason: 'Pensionerad' },
      { months: 18, reason: 'Pensionerad' },
      { months: 12, reason: 'Bytt karriär' },
      { months: 9, reason: 'Flyttat utomlands' },
      { months: 6, reason: 'Flyttat utomlands' },
      { months: 3, reason: 'Långtidssjukskriven' },
      { months: 1, reason: 'Tjänstledig' }
    ]
    
    for (let i = 0; i < Math.min(musiciansToArchive.length, archiveReasons.length); i++) {
      const musician = musiciansToArchive[i]
      const archiveInfo = archiveReasons[i]
      const archiveDate = new Date()
      archiveDate.setMonth(archiveDate.getMonth() - archiveInfo.months)
      
      await prisma.musician.update({
        where: { id: musician.id },
        data: {
          isActive: false,
          isArchived: true,
          archivedAt: archiveDate
        }
      })
      
      console.log(`  ✓ Archived ${musician.firstName} ${musician.lastName} (${archiveInfo.reason})`)
    }
    
    // Create some new archived musicians with history
    console.log('\n👥 Creating historically archived musicians...')
    
    const archivedMusicianData = [
      { 
        firstName: 'Ingvar', 
        lastName: 'Pettersson', 
        reason: 'Pensionerad efter 40 år',
        monthsAgo: 36,
        positions: ['Solocellist']
      },
      { 
        firstName: 'Astrid', 
        lastName: 'Blomberg', 
        reason: 'Pensionerad konsertmästare',
        monthsAgo: 24,
        positions: ['Förste konsertmästare']
      },
      { 
        firstName: 'Gunnar', 
        lastName: 'Lindholm', 
        reason: 'Flyttat till Berlin Philharmonic',
        monthsAgo: 12,
        positions: ['Solohorn']
      },
      { 
        firstName: 'Birgit', 
        lastName: 'Svensson', 
        reason: 'Övergått till dirigering',
        monthsAgo: 8,
        positions: ['Stämledare viola']
      },
      { 
        firstName: 'Torsten', 
        lastName: 'Eklund', 
        reason: 'Hälsoproblem',
        monthsAgo: 4,
        positions: ['Solotrumpet']
      }
    ]
    
    // ID generation helper
    async function generateUniqueId(entityType) {
      const prefixes = { musician: 'MUS' }
      const prefix = prefixes[entityType] || entityType.toUpperCase().slice(0, 4)
      
      const sequence = await prisma.idSequence.findUnique({
        where: { entityType }
      })
      
      let nextNumber = 1
      if (sequence) {
        nextNumber = sequence.lastNumber + 1
        await prisma.idSequence.update({
          where: { entityType },
          data: { lastNumber: nextNumber }
        })
      } else {
        await prisma.idSequence.create({
          data: { entityType, lastNumber: nextNumber }
        })
      }
      
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    for (const data of archivedMusicianData) {
      const musicianId = await generateUniqueId('musician')
      const archiveDate = new Date()
      archiveDate.setMonth(archiveDate.getMonth() - data.monthsAgo)
      
      const musician = await prisma.musician.create({
        data: {
          musicianId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@archived.se`,
          phone: `+46700000000`,
          localResidence: true,
          isActive: false,
          isArchived: true,
          archivedAt: archiveDate
        }
      })
      
      // Add qualifications
      for (const positionName of data.positions) {
        const position = await prisma.position.findFirst({
          where: { name: positionName }
        })
        
        if (position) {
          await prisma.musicianQualification.create({
            data: {
              musicianId: musician.id,
              positionId: position.id
            }
          })
        }
      }
      
      console.log(`  ✓ Created archived musician: ${data.firstName} ${data.lastName} (${data.reason})`)
    }
    
    // Final statistics
    const stats = await prisma.musician.groupBy({
      by: ['isActive', 'isArchived'],
      _count: true
    })
    
    const total = await prisma.musician.count()
    const archived = await prisma.musician.count({ where: { isArchived: true } })
    const inactive = await prisma.musician.count({ where: { isActive: false, isArchived: false } })
    const activeArchived = await prisma.musician.count({ where: { isActive: true, isArchived: true } })
    
    console.log('\n📊 Final musician statistics:')
    console.log(`  Total musicians: ${total}`)
    console.log(`  Active: ${total - archived - inactive}`)
    console.log(`  Inactive (not archived): ${inactive}`)
    console.log(`  Archived: ${archived}`)
    console.log(`  Active but archived (error): ${activeArchived}`)
    
    // Show archive timeline
    const archiveTimeline = await prisma.musician.findMany({
      where: { isArchived: true },
      select: {
        firstName: true,
        lastName: true,
        archivedAt: true
      },
      orderBy: { archivedAt: 'desc' }
    })
    
    console.log('\n📅 Archive timeline:')
    archiveTimeline.forEach(m => {
      const monthsAgo = Math.floor((new Date() - m.archivedAt) / (1000 * 60 * 60 * 24 * 30))
      console.log(`  • ${m.firstName} ${m.lastName} - ${monthsAgo} months ago`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  addArchivedMusicians()
}