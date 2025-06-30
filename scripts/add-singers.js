#!/usr/bin/env node

/**
 * Add Singers - Adds choir singers (sopran, alt, tenor, bas) to the orchestra
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// ID generation function
async function generateUniqueId(entityType) {
  const prefixes = {
    musician: 'MUS',
    instrument: 'INST',
    position: 'POS',
    project: 'PROJ',
    request: 'REQ',
    template: 'TEMP'
  }
  
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
      data: {
        entityType,
        lastNumber: nextNumber
      }
    })
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

// Swedish names for singers
const singerNames = {
  sopran: {
    female: [
      { firstName: 'Astrid', lastName: 'Söderberg' },
      { firstName: 'Kristina', lastName: 'Lundberg' },
      { firstName: 'Cecilia', lastName: 'Holm' },
      { firstName: 'Viktoria', lastName: 'Nordström' },
      { firstName: 'Elsa', lastName: 'Wikström' }
    ]
  },
  alt: {
    female: [
      { firstName: 'Ingrid', lastName: 'Berglund' },
      { firstName: 'Margareta', lastName: 'Sandström' },
      { firstName: 'Helena', lastName: 'Lindqvist' },
      { firstName: 'Katarina', lastName: 'Nyberg' },
      { firstName: 'Annika', lastName: 'Forsberg' }
    ]
  },
  tenor: {
    male: [
      { firstName: 'Lars', lastName: 'Engström' },
      { firstName: 'Johan', lastName: 'Bergman' },
      { firstName: 'Erik', lastName: 'Sjöberg' },
      { firstName: 'Anders', lastName: 'Holmström' },
      { firstName: 'Nils', lastName: 'Lindgren' }
    ]
  },
  bas: {
    male: [
      { firstName: 'Gustav', lastName: 'Åström' },
      { firstName: 'Karl', lastName: 'Magnusson' },
      { firstName: 'Olof', lastName: 'Hedberg' },
      { firstName: 'Sven', lastName: 'Blomberg' },
      { firstName: 'Magnus', lastName: 'Ekberg' }
    ]
  }
}

async function addSingers() {
  log('\n🎤 ADDING SINGERS TO ORCHESTRA...', 'magenta')
  
  try {
    // Check if Sång instrument already exists
    let sangInstrument = await prisma.instrument.findFirst({
      where: { name: 'Sång' }
    })
    
    if (!sangInstrument) {
      // Create Sång instrument
      const instrumentId = await generateUniqueId('instrument')
      sangInstrument = await prisma.instrument.create({
        data: {
          instrumentId,
          name: 'Sång',
          displayOrder: 17
        }
      })
      log('  ✓ Created instrument: Sång', 'green')
    } else {
      log('  ℹ️  Instrument Sång already exists', 'yellow')
    }
    
    // Voice positions to create
    const voicePositions = [
      { name: 'Sopran', hierarchy: 3 },
      { name: 'Alt', hierarchy: 3 },
      { name: 'Tenor', hierarchy: 3 },
      { name: 'Bas', hierarchy: 3 }
    ]
    
    const positions = {}
    let musiciansCreated = 0
    
    for (const voiceData of voicePositions) {
      // Check if position already exists
      let position = await prisma.position.findFirst({
        where: { 
          name: voiceData.name,
          instrumentId: sangInstrument.id
        }
      })
      
      if (!position) {
        const positionId = await generateUniqueId('position')
        position = await prisma.position.create({
          data: {
            positionId,
            instrumentId: sangInstrument.id,
            name: voiceData.name,
            hierarchyLevel: voiceData.hierarchy
          }
        })
        log(`  ✓ Created position: ${voiceData.name}`, 'green')
      } else {
        log(`  ℹ️  Position ${voiceData.name} already exists`, 'yellow')
      }
      
      positions[voiceData.name.toLowerCase()] = position
      
      // Create ranking lists if they don't exist
      const existingLists = await prisma.rankingList.findMany({
        where: { positionId: position.id }
      })
      
      if (existingLists.length === 0) {
        for (const listType of ['A', 'B', 'C']) {
          await prisma.rankingList.create({
            data: {
              positionId: position.id,
              listType,
              description: `${listType}-lista för ${voiceData.name}`
            }
          })
        }
        log(`  ✓ Created A, B, C lists for ${voiceData.name}`, 'green')
      }
      
      // Create singers for this voice type
      const voiceKey = voiceData.name.toLowerCase()
      const namesData = singerNames[voiceKey]
      const names = namesData.female || namesData.male || []
      
      for (const nameData of names) {
        // Check if musician already exists
        const existingMusician = await prisma.musician.findFirst({
          where: {
            firstName: nameData.firstName,
            lastName: nameData.lastName
          }
        })
        
        if (!existingMusician) {
          const musicianId = await generateUniqueId('musician')
          const cleanFirst = nameData.firstName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a])
          const cleanLast = nameData.lastName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a])
          
          const musician = await prisma.musician.create({
            data: {
              musicianId,
              firstName: nameData.firstName,
              lastName: nameData.lastName,
              email: `${cleanFirst}.${cleanLast}@stagesubtest.com`,
              phone: `+467${Math.floor(10000000 + Math.random() * 90000000)}`,
              localResidence: Math.random() < 0.3,
              isActive: true
            }
          })
          
          // Add qualification
          await prisma.musicianQualification.create({
            data: {
              musicianId: musician.id,
              positionId: position.id
            }
          })
          
          musiciansCreated++
          log(`    ✓ Created ${voiceData.name}: ${nameData.firstName} ${nameData.lastName}`, 'cyan')
        }
      }
    }
    
    // Populate ranking lists for singers
    log('\n🏆 Populating ranking lists for singers...', 'cyan')
    
    for (const [voiceKey, position] of Object.entries(positions)) {
      const qualifiedSingers = await prisma.musician.findMany({
        where: {
          qualifications: {
            some: { positionId: position.id }
          }
        }
      })
      
      if (qualifiedSingers.length === 0) continue
      
      const rankingLists = await prisma.rankingList.findMany({
        where: { positionId: position.id }
      })
      
      const aList = rankingLists.find(l => l.listType === 'A')
      const bList = rankingLists.find(l => l.listType === 'B')
      const cList = rankingLists.find(l => l.listType === 'C')
      
      // Distribute singers to lists
      const shuffled = qualifiedSingers.sort(() => Math.random() - 0.5)
      
      // A list - all singers
      if (aList) {
        for (let i = 0; i < shuffled.length; i++) {
          await prisma.ranking.create({
            data: {
              listId: aList.id,
              musicianId: shuffled[i].id,
              rank: i + 1
            }
          })
        }
      }
      
      // B list - 80% of singers
      if (bList) {
        const bSize = Math.ceil(shuffled.length * 0.8)
        for (let i = 0; i < bSize && i < shuffled.length; i++) {
          await prisma.ranking.create({
            data: {
              listId: bList.id,
              musicianId: shuffled[i].id,
              rank: i + 1
            }
          })
        }
      }
      
      // C list - 60% of singers
      if (cList) {
        const cSize = Math.ceil(shuffled.length * 0.6)
        for (let i = 0; i < cSize && i < shuffled.length; i++) {
          await prisma.ranking.create({
            data: {
              listId: cList.id,
              musicianId: shuffled[i].id,
              rank: i + 1
            }
          })
        }
      }
    }
    
    // Summary
    log('\n✅ Singers added successfully!', 'green')
    
    const stats = await prisma.$transaction([
      prisma.musician.count(),
      prisma.position.count({ where: { instrument: { name: 'Sång' } } }),
      prisma.musician.count({ 
        where: { 
          qualifications: { 
            some: { 
              position: { 
                instrument: { name: 'Sång' } 
              } 
            } 
          } 
        } 
      })
    ])
    
    log('\n📊 Summary:', 'blue')
    log(`  • Total musicians in system: ${stats[0]}`, 'blue')
    log(`  • Voice positions: ${stats[1]}`, 'blue')
    log(`  • Total singers: ${stats[2]}`, 'blue')
    log(`  • New singers created: ${musiciansCreated}`, 'green')
    
  } catch (error) {
    log('\n❌ Error adding singers:', 'red')
    log(error.message, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  addSingers()
}