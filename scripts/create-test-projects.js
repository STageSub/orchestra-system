#!/usr/bin/env node

/**
 * Create Test Projects - Generates 10-15 projects with various needs and file attachments
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

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

// Create mock PDF files
async function createMockPDFs() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  
  const mockFiles = [
    { name: 'beethoven-symfoni-5-noter.pdf', type: 'sheet_music' },
    { name: 'mozart-requiem-noter.pdf', type: 'sheet_music' },
    { name: 'brahms-symfoni-1-noter.pdf', type: 'sheet_music' },
    { name: 'mahler-symfoni-2-noter.pdf', type: 'sheet_music' },
    { name: 'sibelius-symfoni-2-noter.pdf', type: 'sheet_music' },
    { name: 'konsert-information.pdf', type: 'info' },
    { name: 'repetitionsschema.pdf', type: 'schedule' },
    { name: 'parkering-vägbeskrivning.pdf', type: 'logistics' },
    { name: 'klädkod-information.pdf', type: 'dress_code' },
    { name: 'turneschema-2025.pdf', type: 'tour' }
  ]
  
  const createdFiles = []
  
  for (const file of mockFiles) {
    const filePath = path.join(uploadsDir, file.name)
    
    // Create a simple PDF-like content (not a real PDF, but good enough for testing)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `Mock PDF content for ${file.name}\nType: ${file.type}\nCreated for testing purposes.`)
    }
    
    createdFiles.push({
      fileName: file.name,
      filePath: `/uploads/${file.name}`,
      fileType: file.type,
      mimeType: 'application/pdf'
    })
  }
  
  return createdFiles
}

// Project templates
const projectTemplates = [
  {
    name: 'Beethoven Symfoni Nr. 5',
    type: 'symphony',
    weeks: 3,
    needs: [
      { position: 'Tutti violin 1', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 4, strategy: 'sequential' },
      { position: 'Tutti cello', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti kontrabas', quantity: 2, strategy: 'sequential' },
      { position: 'Tutti flöjt', quantity: 2, strategy: 'first_come', maxRecipients: 5 },
      { position: 'Tutti horn', quantity: 2, strategy: 'parallel' }
    ],
    files: ['beethoven-symfoni-5-noter.pdf', 'repetitionsschema.pdf']
  },
  {
    name: 'Mozart Requiem',
    type: 'choir_orchestra',
    weeks: 5,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Stämledare violin 2', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 4, strategy: 'first_come', maxRecipients: 8 },
      { position: 'Solofagott', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti fagott', quantity: 1, strategy: 'sequential' },
      { position: 'Solotrumpet', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti trombon', quantity: 2, strategy: 'parallel' },
      { position: 'Solopukist', quantity: 1, strategy: 'sequential' }
    ],
    files: ['mozart-requiem-noter.pdf', 'konsert-information.pdf', 'klädkod-information.pdf']
  },
  {
    name: 'Nyårskonsert - Wienervals',
    type: 'gala',
    weeks: 2,
    needs: [
      { position: 'Andre konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 10, strategy: 'first_come', maxRecipients: 15 },
      { position: 'Tutti violin 2', quantity: 8, strategy: 'first_come', maxRecipients: 12 },
      { position: 'Tutti cello', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti kontrabas', quantity: 3, strategy: 'parallel' },
      { position: 'Harpist', quantity: 1, strategy: 'sequential' },
      { position: 'Slagverkare', quantity: 2, strategy: 'parallel' }
    ],
    files: ['klädkod-information.pdf']
  },
  {
    name: 'Brahms Symfoni Nr. 1',
    type: 'symphony',
    weeks: 6,
    needs: [
      { position: 'Solocellist', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 12, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 10, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 6, strategy: 'parallel' },
      { position: 'Solooboe', quantity: 1, strategy: 'sequential' },
      { position: 'Soloklarinett', quantity: 1, strategy: 'sequential' },
      { position: 'Solohorn', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti horn', quantity: 3, strategy: 'parallel' }
    ],
    files: ['brahms-symfoni-1-noter.pdf', 'repetitionsschema.pdf', 'parkering-vägbeskrivning.pdf']
  },
  {
    name: 'Kammarmusikkonsert',
    type: 'chamber',
    weeks: 1,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Stämledare viola', quantity: 1, strategy: 'sequential' },
      { position: 'Solocellist', quantity: 1, strategy: 'sequential' },
      { position: 'Pianist', quantity: 1, strategy: 'sequential' }
    ],
    files: ['konsert-information.pdf']
  },
  {
    name: 'Mahler Symfoni Nr. 2',
    type: 'symphony',
    weeks: 8,
    needs: [
      { position: 'Tutti violin 1', quantity: 14, strategy: 'first_come', maxRecipients: 20 },
      { position: 'Tutti violin 2', quantity: 12, strategy: 'first_come', maxRecipients: 18 },
      { position: 'Tutti viola', quantity: 10, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti kontrabas', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti flöjt', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti oboe', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti klarinett', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti fagott', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti horn', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti trumpet', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti trombon', quantity: 3, strategy: 'parallel' },
      { position: 'Solotuba', quantity: 1, strategy: 'sequential' },
      { position: 'Slagverkare', quantity: 4, strategy: 'parallel' }
    ],
    files: ['mahler-symfoni-2-noter.pdf', 'repetitionsschema.pdf', 'konsert-information.pdf', 'turneschema-2025.pdf']
  },
  {
    name: 'Sibelius Symfoni Nr. 2',
    type: 'symphony',
    weeks: 7,
    needs: [
      { position: 'Stämledare violin 2', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 10, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 6, strategy: 'sequential' },
      { position: 'Tutti cello', quantity: 5, strategy: 'sequential' },
      { position: 'Tutti kontrabas', quantity: 4, strategy: 'sequential' },
      { position: 'Soloflöjt', quantity: 1, strategy: 'sequential' },
      { position: 'Solooboe', quantity: 1, strategy: 'sequential' }
    ],
    files: ['sibelius-symfoni-2-noter.pdf']
  },
  {
    name: 'Barockensemble - Händel',
    type: 'baroque',
    weeks: 4,
    needs: [
      { position: 'Tutti violin 1', quantity: 4, strategy: 'first_come', maxRecipients: 8 },
      { position: 'Tutti violin 2', quantity: 3, strategy: 'first_come', maxRecipients: 6 },
      { position: 'Tutti viola', quantity: 2, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 2, strategy: 'parallel' },
      { position: 'Stämledare kontrabas', quantity: 1, strategy: 'sequential' },
      { position: 'Solooboe', quantity: 1, strategy: 'sequential' }
    ],
    files: ['repetitionsschema.pdf']
  },
  {
    name: 'Filmmusikkonsert',
    type: 'pops',
    weeks: 9,
    needs: [
      { position: 'Tutti violin 1', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 3, strategy: 'parallel' },
      { position: 'Slagverkare', quantity: 3, strategy: 'first_come', maxRecipients: 6 },
      { position: 'Pianist', quantity: 1, strategy: 'sequential' },
      { position: 'Harpist', quantity: 1, strategy: 'sequential' }
    ],
    files: ['konsert-information.pdf', 'parkering-vägbeskrivning.pdf']
  },
  {
    name: 'Nutida musik - Världspremiär',
    type: 'contemporary',
    weeks: 11,
    needs: [
      { position: 'Soloflöjt', quantity: 1, strategy: 'sequential' },
      { position: 'Piccoloflöjt', quantity: 1, strategy: 'sequential' },
      { position: 'Basklarinett', quantity: 1, strategy: 'sequential' },
      { position: 'Kontrafagott', quantity: 1, strategy: 'sequential' },
      { position: 'Slagverkare', quantity: 4, strategy: 'parallel' },
      { position: 'Pianist', quantity: 1, strategy: 'sequential' }
    ],
    files: ['repetitionsschema.pdf']
  },
  {
    name: 'Skolkonsert - Peter och vargen',
    type: 'education',
    weeks: 10,
    needs: [
      { position: 'Tutti violin 1', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 2, strategy: 'sequential' },
      { position: 'Tutti cello', quantity: 2, strategy: 'sequential' },
      { position: 'Tutti kontrabas', quantity: 1, strategy: 'sequential' },
      { position: 'Soloflöjt', quantity: 1, strategy: 'sequential' },
      { position: 'Solooboe', quantity: 1, strategy: 'sequential' },
      { position: 'Soloklarinett', quantity: 1, strategy: 'sequential' },
      { position: 'Solofagott', quantity: 1, strategy: 'sequential' },
      { position: 'Solohorn', quantity: 1, strategy: 'sequential' }
    ],
    files: []
  },
  {
    name: 'Operagala',
    type: 'opera',
    weeks: 12,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 8, strategy: 'first_come', maxRecipients: null }, // null = all
      { position: 'Tutti violin 2', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 5, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 4, strategy: 'parallel' },
      { position: 'Harpist', quantity: 1, strategy: 'sequential' }
    ],
    files: ['klädkod-information.pdf', 'konsert-information.pdf']
  },
  {
    name: 'Jubileumskonsert 100 år',
    type: 'gala',
    weeks: 15,
    needs: [
      { position: 'Förste konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Andre konsertmästare', quantity: 1, strategy: 'sequential' },
      { position: 'Stämledare violin 2', quantity: 1, strategy: 'sequential' },
      { position: 'Stämledare viola', quantity: 1, strategy: 'sequential' },
      { position: 'Solocellist', quantity: 1, strategy: 'sequential' },
      { position: 'Stämledare kontrabas', quantity: 1, strategy: 'sequential' },
      { position: 'Tutti violin 1', quantity: 12, strategy: 'first_come', maxRecipients: 18 },
      { position: 'Tutti violin 2', quantity: 10, strategy: 'first_come', maxRecipients: 15 },
      { position: 'Tutti viola', quantity: 8, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti kontrabas', quantity: 4, strategy: 'parallel' }
    ],
    files: ['konsert-information.pdf', 'klädkod-information.pdf', 'parkering-vägbeskrivning.pdf']
  },
  {
    name: 'Sommarkonsert utomhus',
    type: 'outdoor',
    weeks: 20,
    needs: [
      { position: 'Tutti violin 1', quantity: 6, strategy: 'parallel' },
      { position: 'Tutti violin 2', quantity: 5, strategy: 'parallel' },
      { position: 'Tutti viola', quantity: 3, strategy: 'sequential' },
      { position: 'Tutti cello', quantity: 3, strategy: 'sequential' },
      { position: 'Tutti kontrabas', quantity: 2, strategy: 'sequential' }
    ],
    files: ['parkering-vägbeskrivning.pdf']
  },
  {
    name: 'Turné - Norrland',
    type: 'tour',
    weeks: 25,
    needs: [
      { position: 'Tutti violin 1', quantity: 8, strategy: 'first_come', maxRecipients: 12 },
      { position: 'Tutti violin 2', quantity: 6, strategy: 'first_come', maxRecipients: 10 },
      { position: 'Tutti viola', quantity: 4, strategy: 'parallel' },
      { position: 'Tutti cello', quantity: 3, strategy: 'parallel' },
      { position: 'Tutti kontrabas', quantity: 2, strategy: 'parallel' },
      { position: 'Tutti horn', quantity: 2, strategy: 'parallel' }
    ],
    files: ['turneschema-2025.pdf', 'konsert-information.pdf']
  }
]

async function createTestProjects() {
  log('\n🎭 CREATING TEST PROJECTS...', 'magenta')
  
  try {
    // Create mock PDFs
    log('\n📄 Creating mock PDF files...', 'cyan')
    const mockFiles = await createMockPDFs()
    log(`  ✓ Created ${mockFiles.length} mock PDF files`, 'green')
    
    // Get current date
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // Create projects
    let projectCount = 0
    const createdProjects = []
    
    for (const template of projectTemplates) {
      const projectId = await generateUniqueId('project')
      
      // Calculate start date based on weeks from now
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() + (template.weeks * 7))
      
      // Calculate ISO week number
      const weekNumber = getISOWeekNumber(startDate)
      
      log(`\n📅 Creating project: ${template.name}`, 'yellow')
      
      const project = await prisma.project.create({
        data: {
          projectId,
          name: template.name,
          startDate,
          weekNumber,
          rehearsalSchedule: template.type === 'tour' 
            ? 'Turné enligt separat schema' 
            : `Repetitioner ${template.weeks > 4 ? 'måndag-fredag' : 'tisdag och torsdag'} veckan innan konsert`,
          concertInfo: `Konserttyp: ${template.type}`,
          notes: `Test projekt - ${template.type} konsert. Skapad för systemtest.`
        }
      })
      
      createdProjects.push(project)
      log(`  ✓ Created project: ${project.name} (Week ${weekNumber})`, 'green')
      
      // Get positions and ranking lists
      const positions = await prisma.position.findMany({
        where: {
          name: { in: template.needs.map(n => n.position) }
        },
        include: {
          rankingLists: true
        }
      })
      
      // Create project needs
      let needCount = 0
      for (const needTemplate of template.needs) {
        const position = positions.find(p => p.name === needTemplate.position)
        if (!position) {
          log(`  ⚠️  Position not found: ${needTemplate.position}`, 'yellow')
          continue
        }
        
        // Use A list by default
        const rankingList = position.rankingLists.find(rl => rl.listType === 'A')
        if (!rankingList) {
          log(`  ⚠️  No A ranking list for: ${needTemplate.position}`, 'yellow')
          continue
        }
        
        const need = await prisma.projectNeed.create({
          data: {
            projectId: project.id,
            positionId: position.id,
            quantity: needTemplate.quantity,
            rankingListId: rankingList.id,
            requestStrategy: needTemplate.strategy,
            maxRecipients: needTemplate.maxRecipients || null,
            responseTimeHours: 48,
            requireLocalResidence: Math.random() < 0.2, // 20% local only
            status: 'active'
          }
        })
        
        needCount++
      }
      
      log(`  ✓ Created ${needCount} needs for project`, 'green')
      
      // Add files to project
      if (template.files.length > 0) {
        let fileCount = 0
        for (const fileName of template.files) {
          const mockFile = mockFiles.find(f => f.fileName === fileName)
          if (!mockFile) continue
          
          // Randomly assign timing
          const timing = mockFile.fileType === 'sheet_music' ? 'on_accept' : 'on_request'
          
          // Add to general project files (some)
          if (Math.random() < 0.3) {
            await prisma.projectFile.create({
              data: {
                projectId: project.id,
                fileName: mockFile.fileName,
                fileUrl: mockFile.filePath,
                fileType: mockFile.mimeType,
                uploadedAt: new Date(),
                sendTiming: timing
              }
            })
            fileCount++
            log(`  ✓ Added general project file: ${fileName} (${timing})`, 'cyan')
          }
          
          // Add to specific needs (some)
          const projectNeeds = await prisma.projectNeed.findMany({
            where: { projectId: project.id },
            take: Math.floor(Math.random() * 3) + 1 // 1-3 needs
          })
          
          for (const need of projectNeeds) {
            await prisma.projectFile.create({
              data: {
                projectId: project.id,
                projectNeedId: need.id,
                fileName: mockFile.fileName,
                fileUrl: mockFile.filePath,
                fileType: mockFile.mimeType,
                uploadedAt: new Date(),
                sendTiming: timing
              }
            })
            fileCount++
          }
        }
        
        log(`  ✓ Added ${fileCount} file associations`, 'green')
      }
      
      projectCount++
    }
    
    // Summary
    log('\n✅ Test projects created successfully!', 'green')
    
    const totalProjects = await prisma.project.count()
    const totalNeeds = await prisma.projectNeed.count()
    const totalFiles = await prisma.projectFile.count()
    
    log('\n📊 Summary:', 'blue')
    log(`  • ${projectCount} new projects created`, 'blue')
    log(`  • ${totalProjects} total projects in system`, 'blue')
    log(`  • ${totalNeeds} total project needs`, 'blue')
    log(`  • ${totalFiles} total file associations`, 'blue')
    
    // Show upcoming projects
    log('\n📅 Upcoming projects:', 'blue')
    const upcomingProjects = await prisma.project.findMany({
      where: {
        startDate: { gte: now }
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      include: {
        _count: {
          select: { projectNeeds: true }
        }
      }
    })
    
    upcomingProjects.forEach(p => {
      const weeksFromNow = Math.ceil((p.startDate - now) / (7 * 24 * 60 * 60 * 1000))
      log(`  • Week ${p.weekNumber}: ${p.name} (${weeksFromNow} weeks away, ${p._count.projectNeeds} needs)`, 'cyan')
    })
    
  } catch (error) {
    log('\n❌ Error creating test projects:', 'red')
    log(error.message, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  createTestProjects()
}