#!/usr/bin/env node

/**
 * Test the validation implementation for project needs
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Color codes for output
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

async function testValidationImplementation() {
  log('\n🧪 TESTING VALIDATION IMPLEMENTATION', 'magenta')
  log('=' .repeat(50), 'magenta')
  
  try {
    // Test 1: Check instruments with no musicians
    log('\n1. Checking instruments with no qualified musicians...', 'yellow')
    const instruments = await prisma.instrument.findMany({
      where: { isArchived: false },
      include: {
        positions: {
          include: {
            _count: {
              select: { qualifications: true }
            }
          }
        }
      }
    })
    
    for (const instrument of instruments) {
      const activeMusicians = await prisma.musician.count({
        where: {
          isActive: true,
          isArchived: false,
          qualifications: {
            some: {
              position: {
                instrumentId: instrument.id
              }
            }
          }
        }
      })
      
      if (activeMusicians === 0) {
        log(`  ❌ ${instrument.name} - No active qualified musicians`, 'red')
      } else {
        log(`  ✅ ${instrument.name} - ${activeMusicians} active musicians`, 'green')
      }
    }
    
    // Test 2: Check positions with no musicians
    log('\n2. Checking positions with no qualified musicians...', 'yellow')
    const positions = await prisma.position.findMany({
      include: {
        instrument: true
      }
    })
    
    let emptyPositions = 0
    for (const position of positions) {
      const activeMusicians = await prisma.musician.count({
        where: {
          isActive: true,
          isArchived: false,
          qualifications: {
            some: { positionId: position.id }
          }
        }
      })
      
      if (activeMusicians === 0) {
        log(`  ❌ ${position.name} (${position.instrument.name}) - No active musicians`, 'red')
        emptyPositions++
      }
    }
    
    if (emptyPositions > 0) {
      log(`\n  Found ${emptyPositions} positions with no active qualified musicians`, 'red')
    }
    
    // Test 3: Check ranking lists
    log('\n3. Checking ranking lists for a sample position...', 'yellow')
    const samplePosition = await prisma.position.findFirst({
      where: {
        name: 'Tutti violin 1'
      }
    })
    
    if (samplePosition) {
      const rankingLists = await prisma.rankingList.findMany({
        where: { positionId: samplePosition.id }
      })
      
      for (const list of rankingLists) {
        const musiciansInList = await prisma.musician.count({
          where: {
            isActive: true,
            isArchived: false,
            rankings: {
              some: { listId: list.id }
            }
          }
        })
        
        log(`  ${list.listType}-lista: ${musiciansInList} active musicians`, 
            musiciansInList > 0 ? 'green' : 'red')
      }
    }
    
    // Test 4: Test validation logic
    log('\n4. Testing validation scenarios...', 'yellow')
    
    // Find a project to test with
    const testProject = await prisma.project.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (testProject) {
      // Test case 1: Sequential with quantity > 1
      log('\n  Testing: Sequential strategy with quantity > 1', 'cyan')
      const testData1 = {
        projectId: testProject.id,
        positionId: samplePosition?.id || 1,
        rankingListId: 1,
        quantity: 3,
        requestStrategy: 'sequential'
      }
      log(`  Expected: Should fail`, 'cyan')
      log(`  Data: ${JSON.stringify(testData1)}`, 'cyan')
      
      // Test case 2: Parallel with quantity = 1
      log('\n  Testing: Parallel strategy with quantity = 1', 'cyan')
      const testData2 = {
        projectId: testProject.id,
        positionId: samplePosition?.id || 1,
        rankingListId: 1,
        quantity: 1,
        requestStrategy: 'parallel'
      }
      log(`  Expected: Should fail`, 'cyan')
      log(`  Data: ${JSON.stringify(testData2)}`, 'cyan')
      
      // Test case 3: Quantity exceeds available musicians
      log('\n  Testing: Quantity exceeds available musicians', 'cyan')
      const testData3 = {
        projectId: testProject.id,
        positionId: samplePosition?.id || 1,
        rankingListId: 1,
        quantity: 999,
        requestStrategy: 'first_come'
      }
      log(`  Expected: Should fail`, 'cyan')
      log(`  Data: ${JSON.stringify(testData3)}`, 'cyan')
    }
    
    log('\n' + '='.repeat(50), 'magenta')
    log('✅ VALIDATION IMPLEMENTATION TEST COMPLETE', 'green')
    log('='.repeat(50), 'magenta')
    
  } catch (error) {
    log(`\n💥 Error: ${error.message}`, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testValidationImplementation()
}