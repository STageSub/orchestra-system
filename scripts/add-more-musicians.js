#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

// Swedish names
const swedishFirstNames = {
  male: [
    'Gunnar', 'Håkan', 'Ulf', 'Rolf', 'Göran', 'Mats', 'Leif', 'Arne', 'Åke', 'Bo',
    'Roger', 'Tommy', 'Kenneth', 'Christer', 'Kent', 'Lennart', 'Roland', 'Bertil', 'Ingemar', 'Hans'
  ],
  female: [
    'Annika', 'Monica', 'Inger', 'Gunilla', 'Malin', 'Carina', 'Susanne', 'Pia', 'Ulrika', 'Agneta',
    'Lisbeth', 'Marianne', 'Barbro', 'Berit', 'Astrid', 'Gudrun', 'Siv', 'Gun', 'Britt', 'Anita'
  ]
}

const swedishLastNames = [
  'Holm', 'Bergström', 'Sandberg', 'Nordin', 'Ström', 'Åberg', 'Ekström', 'Holmgren', 'Hedberg', 'Sundberg',
  'Sjögren', 'Öberg', 'Martinsson', 'Strömberg', 'Nyberg', 'Forsberg', 'Åkesson', 'Blomqvist', 'Isaksson', 'Söderberg'
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

async function addMoreMusicians() {
  console.log('🎼 Adding more musicians to complete the orchestra...')
  
  try {
    // Get positions that need more musicians
    const positions = await prisma.position.findMany({
      include: {
        _count: {
          select: { qualifications: true }
        }
      }
    })
    
    // Target counts for each position type
    const targetCounts = {
      'Stämledare kontrabas': 4,
      'Solopukist': 4,
      'Harpist': 4,
      'Pianist': 4,
      'Solotuba': 4,
      'Biträdande solocellist': 4,
      'Biträdande stämledare viola': 4,
      'Biträdande stämledare violin 2': 4
    }
    
    let totalAdded = 0
    
    for (const position of positions) {
      const currentCount = position._count.qualifications
      const targetCount = targetCounts[position.name] || 
        (position.hierarchyLevel === 1 ? 4 : position.hierarchyLevel === 2 ? 4 : currentCount)
      
      if (currentCount < targetCount) {
        const toAdd = targetCount - currentCount
        console.log(`Adding ${toAdd} musicians to ${position.name}...`)
        
        for (let i = 0; i < toAdd; i++) {
          const { firstName, lastName } = getRandomName()
          const musicianId = await generateUniqueId('musician')
          
          const musician = await prisma.musician.create({
            data: {
              musicianId,
              firstName,
              lastName,
              email: getRandomEmail(firstName, lastName),
              phone: `+467${Math.floor(10000000 + Math.random() * 90000000)}`,
              localResidence: Math.random() < 0.3,
              isActive: Math.random() > 0.05 // 5% inactive
            }
          })
          
          await prisma.musicianQualification.create({
            data: {
              musicianId: musician.id,
              positionId: position.id
            }
          })
          
          totalAdded++
        }
      }
    }
    
    // Add more substitutes with multiple instruments
    console.log('\n👥 Adding more substitute musicians...')
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
          localResidence: Math.random() < 0.5,
          isActive: Math.random() > 0.05
        }
      })
      
      // Give substitutes 2-4 qualifications
      const numQualifications = 2 + Math.floor(Math.random() * 3)
      const selectedPositions = positions
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
      
      totalAdded++
    }
    
    console.log(`\n✅ Added ${totalAdded} musicians`)
    
    // Update rankings for new musicians
    console.log('\n🏆 Updating rankings for new musicians...')
    await require('./populate-rankings.js')
    
    // Final statistics
    const totalMusicians = await prisma.musician.count()
    const inactiveCount = await prisma.musician.count({ where: { isActive: false } })
    const substituteCount = await prisma.musician.count({ where: { lastName: { contains: '-vikarie' } } })
    
    console.log('\n📊 Final orchestra statistics:')
    console.log(`  Total musicians: ${totalMusicians}`)
    console.log(`  Inactive: ${inactiveCount} (${((inactiveCount/totalMusicians)*100).toFixed(1)}%)`)
    console.log(`  Substitutes: ${substituteCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  addMoreMusicians()
}