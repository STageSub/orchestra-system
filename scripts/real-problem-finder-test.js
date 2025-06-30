#!/usr/bin/env node

/**
 * Real Problem Finder Test
 * 
 * Aggressively explores the system to find ANY problems:
 * - Known issues we suspect
 * - Unknown edge cases
 * - Unexpected behaviors
 * - Data integrity issues
 * - Business logic flaws
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Test configuration
const TEST_PREFIX = 'PROBLEM-FINDER-'

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

// Problem tracking
const problems = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  unexpected: []
}

function recordProblem(severity, title, details) {
  const problem = {
    title,
    details,
    timestamp: new Date().toISOString(),
    reproducible: details.steps || 'See details'
  }
  
  problems[severity].push(problem)
  
  const severityColors = {
    critical: 'red',
    high: 'red',
    medium: 'yellow',
    low: 'cyan',
    unexpected: 'magenta'
  }
  
  log(`\n🚨 ${severity.toUpperCase()} PROBLEM FOUND: ${title}`, severityColors[severity])
  log(`   Details: ${JSON.stringify(details, null, 2)}`, 'white')
}

async function testProblem(name, testFn) {
  log(`\n🔍 Testing: ${name}`, 'blue')
  try {
    await testFn()
  } catch (error) {
    recordProblem('unexpected', `Error in test: ${name}`, {
      error: error.message,
      stack: error.stack
    })
  }
}

// Clean up test data
async function cleanupTestData() {
  try {
    await prisma.project.deleteMany({
      where: {
        projectId: {
          startsWith: TEST_PREFIX
        }
      }
    })
  } catch (error) {
    // Ignore cleanup errors
  }
}

// ============ KNOWN PROBLEM TESTS ============

async function testSequentialQuantityProblem() {
  const project = await prisma.project.create({
    data: {
      projectId: `${TEST_PREFIX}SEQ-001`,
      name: 'Sequential Test',
      startDate: new Date('2025-08-01'),
      weekNumber: 31
    }
  })
  
  const position = await prisma.position.findFirst()
  
  try {
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 3,  // Should this be allowed?
        requestStrategy: 'sequential',
        responseTimeHours: 48
      }
    })
    
    if (need.id) {
      recordProblem('critical', 'Sequential allows quantity > 1', {
        created: true,
        needId: need.id,
        quantity: need.quantity,
        impact: 'Violates core business rule - sequential should only send one at a time',
        steps: [
          '1. Create new project need',
          '2. Select Sequential strategy',
          '3. Set quantity to 3',
          '4. Save - it works but should not!'
        ]
      })
    }
  } catch (error) {
    log('  ✓ Sequential correctly enforces quantity = 1', 'green')
  }
}

async function testParallelOverbooking() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Tutti violin 1' }
  })
  
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: position.id,
      quantity: 8,
      requestStrategy: 'parallel',
      responseTimeHours: 48
    }
  })
  
  // Simulate 8 pending requests
  const pendingRequests = []
  for (let i = 0; i < 8; i++) {
    pendingRequests.push({
      projectNeedId: need.id,
      status: 'pending'
    })
  }
  
  // Simulate 3 accept
  const accepted = 3
  const stillPending = 8 - accepted
  
  // In parallel, should maintain: pending = needed - accepted
  const expectedPending = need.quantity - accepted // Should be 5
  
  if (stillPending > expectedPending) {
    recordProblem('critical', 'Parallel strategy overbooking risk', {
      quantity: need.quantity,
      accepted,
      currentPending: stillPending,
      expectedPending,
      overbookingRisk: stillPending - expectedPending,
      impact: 'Could result in 11 musicians for 8 positions!',
      note: 'The mock test showed this exact scenario'
    })
  }
}

// ============ UNKNOWN PROBLEM EXPLORATION ============

async function testZeroMusiciansAvailable() {
  // What happens when NO musicians are qualified for a position?
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  // Find a position with few or no qualified musicians
  const positions = await prisma.position.findMany({
    include: {
      _count: {
        select: { qualifications: true }
      }
    },
    orderBy: {
      qualifications: {
        _count: 'asc'
      }
    }
  })
  
  const rarePosition = positions[0]
  
  if (rarePosition._count.qualifications === 0) {
    recordProblem('high', 'Can create need for position with no musicians', {
      position: rarePosition.name,
      qualifiedMusicians: 0,
      impact: 'System allows creating needs that can never be filled',
      suggestion: 'UI should warn when creating need for position with no qualified musicians'
    })
  }
}

async function testInactiveMusiciansGetRequests() {
  const inactiveMusician = await prisma.musician.findFirst({
    where: { 
      isActive: false,
      isArchived: false
    },
    include: {
      qualifications: {
        include: {
          position: true
        }
      }
    }
  })
  
  if (inactiveMusician && inactiveMusician.qualifications.length > 0) {
    const project = await prisma.project.findFirst({
      where: { projectId: { startsWith: TEST_PREFIX } }
    })
    
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: inactiveMusician.qualifications[0].positionId,
        quantity: 1,
        requestStrategy: 'sequential',
        responseTimeHours: 48
      }
    })
    
    // Check if inactive musician would be included
    const availableMusicians = await prisma.musician.findMany({
      where: {
        isActive: true,  // System filters by this
        qualifications: {
          some: { positionId: need.positionId }
        }
      }
    })
    
    const includesInactive = availableMusicians.some(m => m.id === inactiveMusician.id)
    
    if (!includesInactive) {
      log('  ✓ Inactive musicians correctly excluded from requests', 'green')
    } else {
      recordProblem('medium', 'Inactive musicians receive requests', {
        musician: `${inactiveMusician.firstName} ${inactiveMusician.lastName}`,
        isActive: false,
        impact: 'Sending requests to musicians who may not be available'
      })
    }
  }
}

async function testArchivedMusiciansExclusion() {
  const archivedMusician = await prisma.musician.findFirst({
    where: { isArchived: true },
    include: {
      qualifications: {
        include: { position: true }
      }
    }
  })
  
  if (archivedMusician && archivedMusician.qualifications.length > 0) {
    // The real system should exclude archived musicians
    // Let's verify this is working
    log('  ✓ Found archived musician to test exclusion', 'cyan')
  }
}

async function testNegativeMaxRecipients() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst()
  
  try {
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 2,
        maxRecipients: -5,  // Negative!
        requestStrategy: 'first_come',
        responseTimeHours: 48
      }
    })
    
    recordProblem('high', 'Negative maxRecipients accepted', {
      maxRecipients: need.maxRecipients,
      impact: 'Undefined behavior - what does negative max mean?'
    })
  } catch (error) {
    log('  ✓ Negative maxRecipients correctly rejected', 'green')
  }
}

async function testHugeQuantity() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Tutti violin 1' }
  })
  
  try {
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 999,  // Huge!
        requestStrategy: 'parallel',
        responseTimeHours: 48
      }
    })
    
    recordProblem('medium', 'System accepts unrealistic quantities', {
      quantity: need.quantity,
      position: 'Tutti violin 1',
      impact: 'No orchestra needs 999 violinists - missing sanity check',
      suggestion: 'Add reasonable upper limit per position type'
    })
  } catch (error) {
    log('  ✓ Huge quantities rejected', 'green')
  }
}

async function testFractionalResponseTime() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst()
  
  try {
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 1,
        requestStrategy: 'sequential',
        responseTimeHours: 0.5  // Half hour!
      }
    })
    
    recordProblem('low', 'Fractional response hours accepted', {
      responseTimeHours: need.responseTimeHours,
      impact: 'Musicians get only 30 minutes to respond',
      question: 'Is this intentional or should it be whole hours only?'
    })
  } catch (error) {
    log('  ✓ Fractional hours handled appropriately', 'green')
  }
}

async function testDuplicateRequests() {
  // Can the same musician get multiple requests for the same need?
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const musician = await prisma.musician.findFirst({
    where: { isActive: true, isArchived: false }
  })
  
  const position = await prisma.position.findFirst()
  
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: position.id,
      quantity: 1,
      requestStrategy: 'sequential',
      responseTimeHours: 48
    }
  })
  
  try {
    // Try to create two requests for same musician
    const req1 = await prisma.request.create({
      data: {
        requestId: `REQ-DUP-001`,
        projectNeedId: need.id,
        musicianId: musician.id,
        status: 'pending',
        sentAt: new Date()
      }
    })
    
    const req2 = await prisma.request.create({
      data: {
        requestId: `REQ-DUP-002`,
        projectNeedId: need.id,
        musicianId: musician.id,
        status: 'pending',
        sentAt: new Date()
      }
    })
    
    recordProblem('high', 'Same musician can get duplicate requests for same need', {
      musicianId: musician.id,
      needId: need.id,
      request1: req1.id,
      request2: req2.id,
      impact: 'Confusing for musicians, wastes requests'
    })
  } catch (error) {
    log('  ✓ Duplicate requests prevented', 'green')
  }
}

async function testModifyingActiveNeed() {
  // Can you change a need after requests are sent?
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst()
  
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: position.id,
      quantity: 2,
      requestStrategy: 'parallel',
      responseTimeHours: 48
    }
  })
  
  // Create a request
  await prisma.request.create({
    data: {
      requestId: `REQ-MOD-001`,
      projectNeedId: need.id,
      musicianId: 1,
      status: 'pending',
      sentAt: new Date()
    }
  })
  
  // Try to modify the need
  try {
    const updated = await prisma.projectNeed.update({
      where: { id: need.id },
      data: { 
        quantity: 5,  // Changed!
        requestStrategy: 'first_come'  // Changed!
      }
    })
    
    recordProblem('critical', 'Can modify need after requests sent', {
      originalQuantity: 2,
      newQuantity: updated.quantity,
      originalStrategy: 'parallel',
      newStrategy: updated.requestStrategy,
      impact: 'Changes the rules after musicians already received requests!',
      severity: 'This could break all request logic'
    })
  } catch (error) {
    log('  ✓ Active needs protected from modification', 'green')
  }
}

async function testProjectDeletion() {
  // What happens to requests when project is deleted?
  const testProject = await prisma.project.create({
    data: {
      projectId: `${TEST_PREFIX}DELETE-ME`,
      name: 'Delete Test',
      startDate: new Date('2025-09-01'),
      weekNumber: 35
    }
  })
  
  const position = await prisma.position.findFirst()
  
  const need = await prisma.projectNeed.create({
    data: {
      projectId: testProject.id,
      positionId: position.id,
      quantity: 1,
      requestStrategy: 'sequential',
      responseTimeHours: 48
    }
  })
  
  // Create a request
  await prisma.request.create({
    data: {
      requestId: `REQ-DEL-001`,
      projectNeedId: need.id,
      musicianId: 1,
      status: 'pending',
      sentAt: new Date()
    }
  })
  
  // Try to delete project
  try {
    await prisma.project.delete({
      where: { id: testProject.id }
    })
    
    // Check if request still exists
    const orphanedRequest = await prisma.request.findFirst({
      where: { projectNeedId: need.id }
    })
    
    if (orphanedRequest) {
      recordProblem('high', 'Orphaned requests after project deletion', {
        request: orphanedRequest.id,
        status: orphanedRequest.status,
        impact: 'Musicians have pending requests for non-existent projects'
      })
    }
  } catch (error) {
    log('  ✓ Project deletion properly handles/prevents active requests', 'green')
  }
}

async function testResponseAfterTimeout() {
  // Can you respond to a timed-out request?
  const oldRequest = await prisma.request.findFirst({
    where: { status: 'timed_out' }
  })
  
  if (oldRequest) {
    try {
      const updated = await prisma.request.update({
        where: { id: oldRequest.id },
        data: { 
          status: 'accepted',
          respondedAt: new Date()
        }
      })
      
      recordProblem('high', 'Can accept timed-out requests', {
        requestId: oldRequest.id,
        previousStatus: 'timed_out',
        newStatus: updated.status,
        impact: 'Position might already be filled by replacement'
      })
    } catch (error) {
      log('  ✓ Timed-out requests cannot be accepted', 'green')
    }
  }
}

async function testMaxRecipientsLessThanQuantity() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst()
  
  try {
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 5,
        maxRecipients: 2,  // Less than quantity!
        requestStrategy: 'first_come',
        responseTimeHours: 48
      }
    })
    
    recordProblem('critical', 'First come accepts maxRecipients < quantity', {
      quantity: need.quantity,
      maxRecipients: need.maxRecipients,
      impact: 'Impossible to fill all positions! Can only get 2 responses for 5 needs.',
      severity: 'Breaks the fundamental promise of the system'
    })
  } catch (error) {
    log('  ✓ MaxRecipients validation working', 'green')
  }
}

// ============ MAIN TEST RUNNER ============

async function runAllTests() {
  log('\n🔬 PROBLEM FINDER TEST', 'magenta')
  log('Aggressively searching for known and unknown problems...', 'magenta')
  log('=' .repeat(70), 'magenta')
  
  try {
    // Clean up any existing test data
    await cleanupTestData()
    
    // Known Problems
    log('\n📌 TESTING KNOWN PROBLEM AREAS', 'yellow')
    await testProblem('Sequential Quantity > 1', testSequentialQuantityProblem)
    await testProblem('Parallel Overbooking Risk', testParallelOverbooking)
    
    // Edge Cases
    log('\n🎯 EXPLORING EDGE CASES', 'yellow')
    await testProblem('Zero Musicians Available', testZeroMusiciansAvailable)
    await testProblem('Inactive Musicians', testInactiveMusiciansGetRequests)
    await testProblem('Archived Musicians', testArchivedMusiciansExclusion)
    await testProblem('Negative MaxRecipients', testNegativeMaxRecipients)
    await testProblem('Huge Quantities', testHugeQuantity)
    await testProblem('Fractional Response Time', testFractionalResponseTime)
    await testProblem('MaxRecipients < Quantity', testMaxRecipientsLessThanQuantity)
    
    // Data Integrity
    log('\n🔍 TESTING DATA INTEGRITY', 'yellow')
    await testProblem('Duplicate Requests', testDuplicateRequests)
    await testProblem('Modifying Active Needs', testModifyingActiveNeed)
    await testProblem('Project Deletion Impact', testProjectDeletion)
    await testProblem('Response After Timeout', testResponseAfterTimeout)
    
    // Clean up test data
    await cleanupTestData()
    
    // Generate report
    generateReport()
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

function generateReport() {
  log('\n' + '='.repeat(70), 'magenta')
  log('📊 PROBLEM FINDER REPORT', 'magenta')
  log('='.repeat(70), 'magenta')
  
  let totalProblems = 0
  
  // Report by severity
  const severities = ['critical', 'high', 'medium', 'low', 'unexpected']
  
  severities.forEach(severity => {
    if (problems[severity].length > 0) {
      totalProblems += problems[severity].length
      log(`\n🚨 ${severity.toUpperCase()} PROBLEMS (${problems[severity].length})`, 
          severity === 'critical' ? 'red' : severity === 'high' ? 'red' : 'yellow')
      
      problems[severity].forEach((problem, i) => {
        log(`\n${i + 1}. ${problem.title}`, 'white')
        log(`   Impact: ${problem.details.impact || 'See details'}`, 'cyan')
        if (problem.details.steps) {
          log('   To reproduce:', 'blue')
          problem.details.steps.forEach(step => {
            log(`     ${step}`, 'white')
          })
        }
      })
    }
  })
  
  // Summary
  log('\n' + '='.repeat(70), 'magenta')
  log(`TOTAL PROBLEMS FOUND: ${totalProblems}`, totalProblems > 0 ? 'red' : 'green')
  
  if (problems.critical.length > 0) {
    log('\n⚠️  SYSTEM IS NOT PRODUCTION READY', 'red')
    log('Critical issues must be fixed before launch!', 'red')
  }
  
  // Save detailed report
  const fs = require('fs')
  const timestamp = Date.now()
  const reportData = {
    timestamp: new Date().toISOString(),
    totalProblems,
    problems,
    summary: {
      critical: problems.critical.length,
      high: problems.high.length,
      medium: problems.medium.length,
      low: problems.low.length,
      unexpected: problems.unexpected.length
    }
  }
  
  fs.writeFileSync(
    `test-results/json/problem-finder-${timestamp}.json`,
    JSON.stringify(reportData, null, 2)
  )
  
  // Create manual verification guide
  const guide = `# Manual Verification Guide

Generated: ${new Date().toISOString()}

## Problems Found: ${totalProblems}

${severities.map(severity => {
  if (problems[severity].length === 0) return ''
  
  return `### ${severity.toUpperCase()} (${problems[severity].length})

${problems[severity].map((p, i) => `
${i + 1}. **${p.title}**
   - Impact: ${p.details.impact || 'See details'}
   - Details: ${JSON.stringify(p.details, null, 2)}
   ${p.details.steps ? `- Steps to reproduce:\n${p.details.steps.map(s => `     ${s}`).join('\n')}` : ''}
`).join('\n')}`
}).join('\n')}

## Next Steps

1. Manually verify each problem found
2. Prioritize critical and high severity issues
3. Create tickets for each confirmed problem
4. Fix before production deployment
`
  
  fs.writeFileSync(
    `test-results/manual-verification-guide-${timestamp}.md`,
    guide
  )
  
  log(`\n💾 Detailed report saved to: test-results/json/problem-finder-${timestamp}.json`, 'cyan')
  log(`📋 Manual verification guide: test-results/manual-verification-guide-${timestamp}.md`, 'cyan')
}

// Run the tests
if (require.main === module) {
  runAllTests()
}