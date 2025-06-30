#!/usr/bin/env node

/**
 * Reset Orchestra Data - Safely clean and repopulate database
 * This script removes all musicians, instruments, positions, and rankings
 * Then creates a realistic orchestra with proper test data
 */

const { PrismaClient } = require('@prisma/client')
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
  
  // Get the last number used
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

async function cleanDatabase() {
  log('\n🧹 CLEANING DATABASE...', 'yellow')
  
  try {
    // Use transaction for atomic operation
    await prisma.$transaction(async (tx) => {
      log('Removing communication logs...', 'cyan')
      const comLogs = await tx.communicationLog.deleteMany({})
      log(`  ✓ Deleted ${comLogs.count} communication logs`, 'green')
      
      log('Removing request tokens...', 'cyan')
      const tokens = await tx.requestToken.deleteMany({})
      log(`  ✓ Deleted ${tokens.count} request tokens`, 'green')
      
      log('Removing requests...', 'cyan')
      const requests = await tx.request.deleteMany({})
      log(`  ✓ Deleted ${requests.count} requests`, 'green')
      
      log('Removing group email logs...', 'cyan')
      const groupEmails = await tx.groupEmailLog.deleteMany({})
      log(`  ✓ Deleted ${groupEmails.count} group email logs`, 'green')
      
      log('Removing project files...', 'cyan')
      const projectFiles = await tx.projectFile.deleteMany({})
      log(`  ✓ Deleted ${projectFiles.count} project files`, 'green')
      
      log('Removing project needs...', 'cyan')
      const projectNeeds = await tx.projectNeed.deleteMany({})
      log(`  ✓ Deleted ${projectNeeds.count} project needs`, 'green')
      
      log('Removing projects...', 'cyan')
      const projects = await tx.project.deleteMany({})
      log(`  ✓ Deleted ${projects.count} projects`, 'green')
      
      log('Removing rankings...', 'cyan')
      const rankings = await tx.ranking.deleteMany({})
      log(`  ✓ Deleted ${rankings.count} rankings`, 'green')
      
      log('Removing ranking lists...', 'cyan')
      const rankingLists = await tx.rankingList.deleteMany({})
      log(`  ✓ Deleted ${rankingLists.count} ranking lists`, 'green')
      
      log('Removing musician qualifications...', 'cyan')
      const qualifications = await tx.musicianQualification.deleteMany({})
      log(`  ✓ Deleted ${qualifications.count} qualifications`, 'green')
      
      log('Removing musicians...', 'cyan')
      const musicians = await tx.musician.deleteMany({})
      log(`  ✓ Deleted ${musicians.count} musicians`, 'green')
      
      log('Removing positions...', 'cyan')
      const positions = await tx.position.deleteMany({})
      log(`  ✓ Deleted ${positions.count} positions`, 'green')
      
      log('Removing instruments...', 'cyan')
      const instruments = await tx.instrument.deleteMany({})
      log(`  ✓ Deleted ${instruments.count} instruments`, 'green')
      
      log('Resetting ID sequences...', 'cyan')
      await tx.idSequence.updateMany({
        data: { lastNumber: 0 }
      })
      log('  ✓ ID sequences reset', 'green')
    }, {
      timeout: 60000 // 60 second timeout for large datasets
    })
    
    log('\n✅ Database cleaned successfully!', 'green')
    
    // Show what was preserved
    const templates = await prisma.emailTemplate.count()
    const settings = await prisma.settings.count()
    log('\n📌 Preserved system data:', 'blue')
    log(`  • ${templates} email templates`, 'blue')
    log(`  • ${settings} system settings`, 'blue')
    
  } catch (error) {
    log('\n❌ Error cleaning database:', 'red')
    log(error.message, 'red')
    throw error
  }
}

// Swedish name lists for realistic data
const swedishFirstNames = {
  male: [
    'Erik', 'Lars', 'Karl', 'Anders', 'Per', 'Nils', 'Jan', 'Olof', 'Bengt', 'Sven',
    'Gustav', 'Fredrik', 'Magnus', 'Johan', 'Björn', 'Stefan', 'Henrik', 'Thomas', 'Daniel', 'Mikael',
    'Peter', 'Jonas', 'Marcus', 'Mattias', 'Alexander', 'Viktor', 'Emil', 'Oscar', 'Axel', 'Filip'
  ],
  female: [
    'Maria', 'Anna', 'Margareta', 'Elisabeth', 'Eva', 'Birgitta', 'Kristina', 'Karin', 'Elisabet', 'Ingrid',
    'Christina', 'Linnéa', 'Kerstin', 'Lena', 'Helena', 'Emma', 'Johanna', 'Sofia', 'Linda', 'Sara',
    'Elin', 'Amanda', 'Hanna', 'Maja', 'Alice', 'Julia', 'Wilma', 'Ella', 'Klara', 'Ebba'
  ]
}

const swedishLastNames = [
  'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson',
  'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Jönsson', 'Lindberg', 'Jakobsson', 'Magnusson', 'Olofsson',
  'Lindström', 'Lindqvist', 'Lindgren', 'Berg', 'Berglund', 'Lundberg', 'Lundgren', 'Lundqvist', 'Mattsson', 'Bergh',
  'Nordström', 'Nyström', 'Holmberg', 'Björk', 'Wallin', 'Engström', 'Danielsson', 'Håkansson', 'Månsson', 'Sjöberg'
]

function getRandomName(gender = null) {
  if (!gender) gender = Math.random() > 0.5 ? 'male' : 'female'
  const firstNames = swedishFirstNames[gender]
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = swedishLastNames[Math.floor(Math.random() * swedishLastNames.length)]
  return { firstName, lastName }
}

function getRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'symphony.se', 'orkester.se']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const cleanFirst = firstName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a])
  const cleanLast = lastName.toLowerCase().replace(/[åäö]/g, a => ({å:'a',ä:'a',ö:'o'})[a])
  return `${cleanFirst}.${cleanLast}@${domain}`
}

async function createOrchestraData() {
  log('\n🎼 CREATING ORCHESTRA DATA...', 'yellow')
  
  try {
    // Create instruments with display order
    log('\n📯 Creating instruments...', 'cyan')
    const instrumentsData = [
      { name: 'Violin', displayOrder: 1 },
      { name: 'Viola', displayOrder: 2 },
      { name: 'Cello', displayOrder: 3 },
      { name: 'Kontrabas', displayOrder: 4 },
      { name: 'Flöjt', displayOrder: 5 },
      { name: 'Oboe', displayOrder: 6 },
      { name: 'Klarinett', displayOrder: 7 },
      { name: 'Fagott', displayOrder: 8 },
      { name: 'Horn', displayOrder: 9 },
      { name: 'Trumpet', displayOrder: 10 },
      { name: 'Trombon', displayOrder: 11 },
      { name: 'Tuba', displayOrder: 12 },
      { name: 'Pukor', displayOrder: 13 },
      { name: 'Slagverk', displayOrder: 14 },
      { name: 'Harpa', displayOrder: 15 },
      { name: 'Piano', displayOrder: 16 },
      { name: 'Sång', displayOrder: 17 }
    ]
    
    const instruments = {}
    for (const data of instrumentsData) {
      const instrumentId = await generateUniqueId('instrument')
      const instrument = await prisma.instrument.create({
        data: {
          instrumentId,
          name: data.name,
          displayOrder: data.displayOrder
        }
      })
      instruments[data.name] = instrument
      log(`  ✓ Created ${data.name}`, 'green')
    }
    
    // Create positions for each instrument
    log('\n🎭 Creating positions...', 'cyan')
    const positionsData = [
      // Violin positions
      { instrument: 'Violin', name: 'Förste konsertmästare', hierarchy: 1 },
      { instrument: 'Violin', name: 'Andre konsertmästare', hierarchy: 1 },
      { instrument: 'Violin', name: 'Stämledare violin 2', hierarchy: 2 },
      { instrument: 'Violin', name: 'Biträdande stämledare violin 2', hierarchy: 2 },
      { instrument: 'Violin', name: 'Tutti violin 1', hierarchy: 3 },
      { instrument: 'Violin', name: 'Tutti violin 2', hierarchy: 3 },
      
      // Viola positions
      { instrument: 'Viola', name: 'Stämledare viola', hierarchy: 2 },
      { instrument: 'Viola', name: 'Biträdande stämledare viola', hierarchy: 2 },
      { instrument: 'Viola', name: 'Tutti viola', hierarchy: 3 },
      
      // Cello positions
      { instrument: 'Cello', name: 'Solocellist', hierarchy: 1 },
      { instrument: 'Cello', name: 'Biträdande solocellist', hierarchy: 2 },
      { instrument: 'Cello', name: 'Tutti cello', hierarchy: 3 },
      
      // Kontrabas positions
      { instrument: 'Kontrabas', name: 'Stämledare kontrabas', hierarchy: 2 },
      { instrument: 'Kontrabas', name: 'Tutti kontrabas', hierarchy: 3 },
      
      // Woodwind positions
      { instrument: 'Flöjt', name: 'Soloflöjt', hierarchy: 1 },
      { instrument: 'Flöjt', name: 'Tutti flöjt', hierarchy: 3 },
      { instrument: 'Flöjt', name: 'Piccoloflöjt', hierarchy: 3 },
      
      { instrument: 'Oboe', name: 'Solooboe', hierarchy: 1 },
      { instrument: 'Oboe', name: 'Tutti oboe', hierarchy: 3 },
      { instrument: 'Oboe', name: 'Engelskt horn', hierarchy: 3 },
      
      { instrument: 'Klarinett', name: 'Soloklarinett', hierarchy: 1 },
      { instrument: 'Klarinett', name: 'Tutti klarinett', hierarchy: 3 },
      { instrument: 'Klarinett', name: 'Basklarinett', hierarchy: 3 },
      
      { instrument: 'Fagott', name: 'Solofagott', hierarchy: 1 },
      { instrument: 'Fagott', name: 'Tutti fagott', hierarchy: 3 },
      { instrument: 'Fagott', name: 'Kontrafagott', hierarchy: 3 },
      
      // Brass positions
      { instrument: 'Horn', name: 'Solohorn', hierarchy: 1 },
      { instrument: 'Horn', name: 'Tutti horn', hierarchy: 3 },
      
      { instrument: 'Trumpet', name: 'Solotrumpet', hierarchy: 1 },
      { instrument: 'Trumpet', name: 'Tutti trumpet', hierarchy: 3 },
      
      { instrument: 'Trombon', name: 'Solotrombon', hierarchy: 1 },
      { instrument: 'Trombon', name: 'Tutti trombon', hierarchy: 3 },
      { instrument: 'Trombon', name: 'Bastrombon', hierarchy: 3 },
      
      { instrument: 'Tuba', name: 'Solotuba', hierarchy: 1 },
      
      // Percussion & others
      { instrument: 'Pukor', name: 'Solopukist', hierarchy: 1 },
      { instrument: 'Slagverk', name: 'Slagverkare', hierarchy: 3 },
      { instrument: 'Harpa', name: 'Harpist', hierarchy: 1 },
      { instrument: 'Piano', name: 'Pianist', hierarchy: 1 },
      
      // Voice positions
      { instrument: 'Sång', name: 'Sopran', hierarchy: 3 },
      { instrument: 'Sång', name: 'Alt', hierarchy: 3 },
      { instrument: 'Sång', name: 'Tenor', hierarchy: 3 },
      { instrument: 'Sång', name: 'Bas', hierarchy: 3 }
    ]
    
    const positions = {}
    for (const data of positionsData) {
      const positionId = await generateUniqueId('position')
      const position = await prisma.position.create({
        data: {
          positionId,
          instrumentId: instruments[data.instrument].id,
          name: data.name,
          hierarchyLevel: data.hierarchy
        }
      })
      positions[data.name] = position
      log(`  ✓ Created ${data.name} (${data.instrument})`, 'green')
    }
    
    // Create ranking lists (A, B, C) for each position
    log('\n📋 Creating ranking lists...', 'cyan')
    const rankingLists = {}
    for (const [posName, position] of Object.entries(positions)) {
      for (const listType of ['A', 'B', 'C']) {
        const list = await prisma.rankingList.create({
          data: {
            positionId: position.id,
            listType,
            description: `${listType}-lista för ${posName}`
          }
        })
        if (!rankingLists[posName]) rankingLists[posName] = {}
        rankingLists[posName][listType] = list
      }
    }
    log('  ✓ Created A, B, C lists for all positions', 'green')
    
    // Create musicians
    log('\n👥 Creating musicians...', 'cyan')
    const musicians = []
    
    // Configuration for musician count per position
    const musicianCounts = {
      // Strings - larger sections
      'Tutti violin 1': 14,
      'Tutti violin 2': 12,
      'Tutti viola': 10,
      'Tutti cello': 8,
      'Tutti kontrabas': 6,
      
      // Woodwinds & Brass - standard sections
      'Tutti flöjt': 4,
      'Tutti oboe': 4,
      'Tutti klarinett': 4,
      'Tutti fagott': 4,
      'Tutti horn': 5,
      'Tutti trumpet': 4,
      'Tutti trombon': 4,
      
      // Solo/Principal positions - minimum 4 each
      'default': 4,
      
      // Voice positions - 5 each
      'Sopran': 5,
      'Alt': 5,
      'Tenor': 5,
      'Bas': 5
    }
    
    // Create musicians for each position
    let musicianCount = 0
    for (const [posName, position] of Object.entries(positions)) {
      const count = musicianCounts[posName] || musicianCounts.default
      
      for (let i = 0; i < count; i++) {
        const { firstName, lastName } = getRandomName()
        const isSubstitute = Math.random() < 0.1 // 10% are substitutes
        const musicianId = await generateUniqueId('musician')
        
        const musician = await prisma.musician.create({
          data: {
            musicianId,
            firstName,
            lastName: isSubstitute ? `${lastName}-vikarie` : lastName,
            email: getRandomEmail(firstName, lastName),
            phone: `+467${Math.floor(10000000 + Math.random() * 90000000)}`,
            localResidence: Math.random() < 0.3, // 30% have local residence
            isActive: Math.random() > 0.05 // 95% active, 5% inactive
          }
        })
        
        // Add primary qualification
        await prisma.musicianQualification.create({
          data: {
            musicianId: musician.id,
            positionId: position.id
          }
        })
        
        // Add additional qualifications for some musicians (20%)
        if (Math.random() < 0.2) {
          // Can also play in other positions of same instrument
          const sameInstrumentPositions = Object.values(positions).filter(p => 
            p.instrumentId === position.instrumentId && p.id !== position.id
          )
          if (sameInstrumentPositions.length > 0) {
            const additionalPos = sameInstrumentPositions[Math.floor(Math.random() * sameInstrumentPositions.length)]
            await prisma.musicianQualification.create({
              data: {
                musicianId: musician.id,
                positionId: additionalPos.id
              }
            })
          }
        }
        
        musicians.push({ musician, position: posName })
        musicianCount++
      }
    }
    
    log(`  ✓ Created ${musicianCount} musicians`, 'green')
    
    // Create substitutes with multiple qualifications
    log('\n👥 Creating substitute musicians...', 'cyan')
    for (let i = 0; i < 10; i++) {
      const { firstName, lastName } = getRandomName()
      const musicianId = await generateUniqueId('musician')
      
      const substitute = await prisma.musician.create({
        data: {
          musicianId,
          firstName,
          lastName: `${lastName}-vikarie`,
          email: getRandomEmail(firstName, lastName),
          phone: `+467${Math.floor(10000000 + Math.random() * 90000000)}`,
          localResidence: Math.random() < 0.5, // 50% for substitutes
          isActive: Math.random() > 0.05 // 95% active, 5% inactive
        }
      })
      
      // Give substitutes 2-3 qualifications
      const numQualifications = 2 + Math.floor(Math.random() * 2)
      const selectedPositions = Object.values(positions)
        .sort(() => Math.random() - 0.5)
        .slice(0, numQualifications)
      
      for (const pos of selectedPositions) {
        await prisma.musicianQualification.create({
          data: {
            musicianId: substitute.id,
            positionId: pos.id
          }
        })
      }
      
      musicians.push({ musician: substitute, position: 'Vikarie' })
    }
    log('  ✓ Created 10 substitute musicians', 'green')
    
    // Populate ranking lists
    log('\n🏆 Populating ranking lists...', 'cyan')
    for (const [posName, position] of Object.entries(positions)) {
      // Get all musicians qualified for this position
      const qualifiedMusicians = await prisma.musician.findMany({
        where: {
          qualifications: {
            some: {
              positionId: position.id
            }
          }
        }
      })
      
      // Shuffle musicians
      const shuffled = qualifiedMusicians.sort(() => Math.random() - 0.5)
      
      // Distribute to lists with MORE overlap for testing conflicts
      const aListSize = Math.ceil(shuffled.length * 0.6) // 60% in A list
      const bListSize = Math.ceil(shuffled.length * 0.7) // 70% in B list
      const cListSize = Math.ceil(shuffled.length * 0.5) // 50% in C list
      
      // A list - top musicians
      for (let i = 0; i < aListSize && i < shuffled.length; i++) {
        await prisma.ranking.create({
          data: {
            listId: rankingLists[posName].A.id,
            musicianId: shuffled[i].id,
            rank: i + 1
          }
        })
      }
      
      // B list - with 50% overlap from A
      const bStartIndex = Math.floor(aListSize * 0.5) // 50% overlap with A
      for (let i = 0; i < bListSize && (bStartIndex + i) < shuffled.length; i++) {
        await prisma.ranking.create({
          data: {
            listId: rankingLists[posName].B.id,
            musicianId: shuffled[bStartIndex + i].id,
            rank: i + 1
          }
        })
      }
      
      // C list - with 40% overlap from B
      const cStartIndex = Math.floor(shuffled.length - cListSize * 1.4) // 40% overlap with B
      for (let i = 0; i < cListSize && (cStartIndex + i) < shuffled.length; i++) {
        await prisma.ranking.create({
          data: {
            listId: rankingLists[posName].C.id,
            musicianId: shuffled[cStartIndex + i].id,
            rank: i + 1
          }
        })
      }
    }
    log('  ✓ Populated all ranking lists with overlap', 'green')
    
    // Create violinists who can play both violin 1 and 2
    log('\n🎻 Adding cross-qualified violinists...', 'cyan')
    const violin1Musicians = await prisma.musician.findMany({
      where: {
        qualifications: {
          some: {
            position: {
              name: 'Tutti violin 1'
            }
          }
        }
      },
      take: 5
    })
    
    const violin2Position = positions['Tutti violin 2']
    for (const musician of violin1Musicians) {
      await prisma.musicianQualification.create({
        data: {
          musicianId: musician.id,
          positionId: violin2Position.id
        }
      })
    }
    log('  ✓ Added violin 2 qualification to 5 violin 1 players', 'green')
    
    // Summary
    log('\n✅ Orchestra data created successfully!', 'green')
    
    const totalMusicians = await prisma.musician.count()
    const totalPositions = await prisma.position.count()
    const totalRankings = await prisma.ranking.count()
    const totalQualifications = await prisma.musicianQualification.count()
    
    log('\n📊 Summary:', 'blue')
    log(`  • ${Object.keys(instruments).length} instruments`, 'blue')
    log(`  • ${totalPositions} positions`, 'blue')
    log(`  • ${totalMusicians} musicians (including substitutes)`, 'blue')
    log(`  • ${totalQualifications} qualifications`, 'blue')
    log(`  • ${totalRankings} ranking entries`, 'blue')
    
  } catch (error) {
    log('\n❌ Error creating orchestra data:', 'red')
    log(error.message, 'red')
    throw error
  }
}

async function main() {
  log('🎼 ORCHESTRA DATA RESET SCRIPT', 'magenta')
  log('================================', 'magenta')
  
  try {
    // Clean existing data
    await cleanDatabase()
    
    // Create new orchestra data
    await createOrchestraData()
    
    log('\n🎉 Orchestra data reset complete!', 'green')
    log('You can now run stress tests with realistic data.', 'green')
    
  } catch (error) {
    log('\n💥 Fatal error:', 'red')
    log(error.stack, 'red')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}