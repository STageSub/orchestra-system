#!/usr/bin/env node

/**
 * Create Completed Projects - Generates historical projects with request history
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

// Calculate ISO week number (Swedish standard)
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Completed project templates - all 100% successful
const completedProjects = [
  {
    name: 'Vårkonsert 2025 - Vivaldi Årstiderna',
    type: 'seasonal',
    monthsAgo: 3,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1 },
      { position: 'Tutti violin 1', quantity: 8 },
      { position: 'Tutti violin 2', quantity: 6 },
      { position: 'Tutti viola', quantity: 4 },
      { position: 'Tutti cello', quantity: 3 },
      { position: 'Stämledare kontrabas', quantity: 1 }
    ]
  },
  {
    name: 'Julkonsert 2024',
    type: 'seasonal',
    monthsAgo: 6,
    needs: [
      { position: 'Andre konsertmästare', quantity: 1 },
      { position: 'Tutti violin 1', quantity: 10 },
      { position: 'Tutti violin 2', quantity: 8 },
      { position: 'Tutti viola', quantity: 6 },
      { position: 'Tutti cello', quantity: 4 },
      { position: 'Harpist', quantity: 1 },
      { position: 'Soloflöjt', quantity: 1 }
    ]
  },
  {
    name: 'Beethoven Festival - Symfoni 3, 5 & 9',
    type: 'festival',
    monthsAgo: 4,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1 },
      { position: 'Tutti violin 1', quantity: 12 },
      { position: 'Tutti violin 2', quantity: 10 },
      { position: 'Tutti viola', quantity: 8 },
      { position: 'Tutti cello', quantity: 6 },
      { position: 'Tutti kontrabas', quantity: 5 },
      { position: 'Tutti horn', quantity: 4 },
      { position: 'Solopukist', quantity: 1 }
    ]
  },
  {
    name: 'Midsommarkonsert 2024',
    type: 'outdoor',
    monthsAgo: 12,
    needs: [
      { position: 'Tutti violin 1', quantity: 6 },
      { position: 'Tutti violin 2', quantity: 5 },
      { position: 'Tutti viola', quantity: 4 },
      { position: 'Tutti cello', quantity: 3 },
      { position: 'Tutti kontrabas', quantity: 2 }
    ]
  },
  {
    name: 'Sibelius Minneskonsert',
    type: 'memorial',
    monthsAgo: 8,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1 },
      { position: 'Solocellist', quantity: 1 },
      { position: 'Tutti violin 1', quantity: 10 },
      { position: 'Tutti violin 2', quantity: 8 },
      { position: 'Tutti viola', quantity: 6 },
      { position: 'Tutti cello', quantity: 5 },
      { position: 'Solooboe', quantity: 1 },
      { position: 'Soloklarinett', quantity: 1 }
    ]
  },
  {
    name: 'Familjeföreställning - Djurens Karneval',
    type: 'family',
    monthsAgo: 2,
    needs: [
      { position: 'Tutti violin 1', quantity: 4 },
      { position: 'Tutti violin 2', quantity: 3 },
      { position: 'Tutti cello', quantity: 2 },
      { position: 'Slagverkare', quantity: 2 },
      { position: 'Pianist', quantity: 1 }
    ]
  },
  {
    name: 'Nyårskonsert 2024 - Straussgala',
    type: 'gala',
    monthsAgo: 18,
    needs: [
      { position: 'Tutti violin 1', quantity: 8 },
      { position: 'Tutti violin 2', quantity: 6 },
      { position: 'Tutti viola', quantity: 4 },
      { position: 'Tutti cello', quantity: 3 },
      { position: 'Tutti kontrabas', quantity: 2 },
      { position: 'Harpist', quantity: 1 }
    ]
  },
  {
    name: 'Modern Musik Festival - Nordic Sounds',
    type: 'contemporary',
    monthsAgo: 9,
    needs: [
      { position: 'Soloflöjt', quantity: 1 },
      { position: 'Piccoloflöjt', quantity: 1 },
      { position: 'Basklarinett', quantity: 1 },
      { position: 'Slagverkare', quantity: 3 },
      { position: 'Pianist', quantity: 1 },
      { position: 'Harpist', quantity: 1 }
    ]
  },
  {
    name: 'Mozartveckan',
    type: 'festival',
    monthsAgo: 10,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1 },
      { position: 'Tutti violin 1', quantity: 8 },
      { position: 'Tutti violin 2', quantity: 6 },
      { position: 'Tutti viola', quantity: 4 },
      { position: 'Tutti cello', quantity: 3 },
      { position: 'Solooboe', quantity: 1 },
      { position: 'Solohorn', quantity: 1 }
    ]
  },
  {
    name: 'Barnens Favoriter - Filmmusik',
    type: 'family',
    monthsAgo: 5,
    needs: [
      { position: 'Tutti violin 1', quantity: 6 },
      { position: 'Tutti violin 2', quantity: 4 },
      { position: 'Tutti cello', quantity: 2 },
      { position: 'Slagverkare', quantity: 2 },
      { position: 'Solotrumpet', quantity: 1 }
    ]
  }
]

async function createRequestHistory(projectNeed, positionName, quantity) {
  const position = await prisma.position.findFirst({
    where: { name: positionName }
  })
  
  if (!position) return 0
  
  // Get musicians qualified for this position
  const qualifiedMusicians = await prisma.musician.findMany({
    where: {
      qualifications: {
        some: { positionId: position.id }
      },
      isArchived: false,
      isActive: true
    },
    orderBy: { id: 'asc' },
    take: quantity
  })
  
  let created = 0
  
  // Create accepted requests for all positions
  for (let i = 0; i < quantity && i < qualifiedMusicians.length; i++) {
    const musician = qualifiedMusicians[i]
    const requestId = await generateUniqueId('request')
    
    const sentDate = new Date(projectNeed.project.startDate)
    sentDate.setDate(sentDate.getDate() - 30) // Sent 30 days before project
    
    const respondDate = new Date(sentDate)
    respondDate.setDate(respondDate.getDate() + Math.floor(Math.random() * 3) + 1) // Respond 1-3 days later
    
    const request = await prisma.request.create({
      data: {
        requestId,
        projectNeedId: projectNeed.id,
        musicianId: musician.id,
        status: 'accepted',
        sentAt: sentDate,
        respondedAt: respondDate,
        response: 'accepted',
        confirmationSent: true
      }
    })
    
    // Create communication log
    await prisma.communicationLog.create({
      data: {
        requestId: request.id,
        type: 'request_sent',
        timestamp: sentDate,
        emailContent: `Förfrågan skickad till ${musician.firstName} ${musician.lastName}`
      }
    })
    
    await prisma.communicationLog.create({
      data: {
        requestId: request.id,
        type: 'confirmation_sent',
        timestamp: respondDate,
        emailContent: `Bekräftelse skickad till ${musician.firstName} ${musician.lastName}`
      }
    })
    
    created++
  }
  
  return created
}

async function createCompletedProjects() {
  log('\n🎭 CREATING COMPLETED PROJECTS...', 'magenta')
  
  try {
    const now = new Date()
    let projectCount = 0
    
    for (const template of completedProjects) {
      const projectId = await generateUniqueId('project')
      
      // Calculate past date
      const startDate = new Date(now)
      startDate.setMonth(startDate.getMonth() - template.monthsAgo)
      
      // Calculate ISO week number
      const weekNumber = getISOWeekNumber(startDate)
      
      log(`\n📅 Creating completed project: ${template.name}`, 'yellow')
      
      const project = await prisma.project.create({
        data: {
          projectId,
          name: template.name,
          startDate,
          weekNumber,
          rehearsalSchedule: 'Genomfört enligt plan',
          concertInfo: `Konserttyp: ${template.type}`,
          notes: `Genomförd konsert med 100% bemanningsgrad. Alla behov uppfyllda.`
        }
      })
      
      log(`  ✓ Created project: ${project.name} (${template.monthsAgo} månader sedan)`, 'green')
      
      // Create project needs with history
      let totalRequests = 0
      for (const needTemplate of template.needs) {
        const position = await prisma.position.findFirst({
          where: { name: needTemplate.position },
          include: { rankingLists: true }
        })
        
        if (!position || position.rankingLists.length === 0) continue
        
        const need = await prisma.projectNeed.create({
          data: {
            projectId: project.id,
            positionId: position.id,
            quantity: needTemplate.quantity,
            rankingListId: position.rankingLists[0].id,
            requestStrategy: 'sequential',
            responseTimeHours: 48,
            status: 'completed'
          },
          include: { project: true }
        })
        
        // Create request history - all accepted
        const requests = await createRequestHistory(need, needTemplate.position, needTemplate.quantity)
        totalRequests += requests
      }
      
      log(`  ✓ Created ${template.needs.length} needs with ${totalRequests} accepted requests`, 'green')
      log(`  ✓ Status: Genomförd med 100% bemanning`, 'green')
      
      projectCount++
    }
    
    // Summary
    log('\n✅ Genomförda projekt skapade!', 'green')
    
    const stats = await prisma.$transaction([
      prisma.project.count({ where: { startDate: { lt: now } } }),
      prisma.request.count({ where: { status: 'accepted' } }),
      prisma.projectNeed.count({ where: { status: 'completed' } }),
      prisma.communicationLog.count()
    ])
    
    log('\n📊 Sammanfattning:', 'blue')
    log(`  • ${projectCount} genomförda projekt skapade`, 'blue')
    log(`  • ${stats[0]} totalt antal tidigare projekt`, 'blue')
    log(`  • ${stats[1]} accepterade förfrågningar`, 'green')
    log(`  • ${stats[2]} fullständigt bemannade behov`, 'green')
    log(`  • ${stats[3]} kommunikationsloggar`, 'blue')
    log('\n  Alla genomförda projekt har 100% bemanning! 🎉', 'green')
    
  } catch (error) {
    log('\n❌ Error creating completed projects:', 'red')
    log(error.message, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  createCompletedProjects()
}