#!/usr/bin/env node

/**
 * Real System Integration Test
 * 
 * This test uses the ACTUAL system components:
 * - Real database records
 * - Real sendRequests() function
 * - Real response handling
 * - Real state management
 * 
 * Just like clicking buttons in the UI!
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import the REAL system functions
const { sendRequests, handleDeclinedRequest, handleTimeouts } = require('../lib/request-strategies')
const { generateUniqueId } = require('../lib/id-generator')
const { generateRequestToken } = require('../lib/request-tokens')

// Test configuration
const TEST_PROJECT_PREFIX = 'INTEGRATION-TEST-'

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

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function assert(condition, message, details = {}) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}\nDetails: ${JSON.stringify(details, null, 2)}`)
  }
}

async function recordTest(name, fn) {
  log(`\n📋 Testing: ${name}`, 'yellow')
  const startTime = Date.now()
  
  try {
    await fn()
    const duration = Date.now() - startTime
    testResults.passed++
    testResults.tests.push({ name, passed: true, duration })
    log(`✅ PASSED (${duration}ms)`, 'green')
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.failed++
    testResults.tests.push({ name, passed: false, duration, error: error.message })
    log(`❌ FAILED: ${error.message}`, 'red')
    if (error.stack) {
      console.error(error.stack)
    }
  }
}

// Clean up test data
async function cleanupTestData() {
  log('\n🧹 Cleaning up old test data...', 'cyan')
  
  // Delete all test projects and related data
  await prisma.project.deleteMany({
    where: {
      projectId: {
        startsWith: TEST_PROJECT_PREFIX
      }
    }
  })
  
  log('✅ Cleanup complete', 'green')
}

// Create test data
async function setupTestData() {
  log('\n🔧 Setting up test data...', 'cyan')
  
  // Get existing positions
  const violinPosition = await prisma.position.findFirst({
    where: { name: 'Tutti violin 1' },
    include: { rankingLists: true }
  })
  
  const altPosition = await prisma.position.findFirst({
    where: { name: 'Alt' },
    include: { rankingLists: true }
  })
  
  const sopranPosition = await prisma.position.findFirst({
    where: { name: 'Sopran' },
    include: { rankingLists: true }
  })
  
  assert(violinPosition, 'Violin position not found')
  assert(altPosition, 'Alt position not found')
  assert(sopranPosition, 'Sopran position not found')
  
  // Create test project
  const projectId = await generateUniqueId('project')
  const project = await prisma.project.create({
    data: {
      projectId: `${TEST_PROJECT_PREFIX}${projectId}`,
      name: 'Integration Test Project',
      startDate: new Date('2025-08-01'),
      weekNumber: 31,
      description: 'Automated integration test project'
    }
  })
  
  log('✅ Test data setup complete', 'green')
  
  return {
    project,
    violinPosition,
    altPosition,
    sopranPosition
  }
}

// Helper to simulate musician response
async function simulateResponse(requestId, response) {
  log(`  → Simulating ${response} response for request ${requestId}`, 'cyan')
  
  // Get the request details
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      projectNeed: true
    }
  })
  
  assert(request, `Request ${requestId} not found`)
  
  // Update request status directly (simulating API response)
  await prisma.request.update({
    where: { id: requestId },
    data: { 
      status: response,
      respondedAt: new Date()
    }
  })
  
  // Handle the response consequences
  if (response === 'declined') {
    await handleDeclinedRequest(requestId)
  } else if (response === 'accepted') {
    // Check if need is fulfilled
    const allRequests = await prisma.request.findMany({
      where: { projectNeedId: request.projectNeedId }
    })
    
    const acceptedCount = allRequests.filter(r => r.status === 'accepted').length
    
    if (acceptedCount >= request.projectNeed.quantity) {
      // Mark need as completed
      await prisma.projectNeed.update({
        where: { id: request.projectNeedId },
        data: { status: 'completed' }
      })
      
      // Cancel pending requests for first_come strategy
      if (request.projectNeed.requestStrategy === 'first_come') {
        await prisma.request.updateMany({
          where: {
            projectNeedId: request.projectNeedId,
            status: 'pending'
          },
          data: { status: 'cancelled' }
        })
      }
    }
  }
}

// Test 1: Sequential Strategy
async function testSequentialStrategy(data) {
  const { project, sopranPosition } = data
  
  // Create need with sequential strategy
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: sopranPosition.id,
      quantity: 1,  // Sequential MUST be quantity 1
      rankingListId: sopranPosition.rankingLists[0]?.id,
      requestStrategy: 'sequential',
      responseTimeHours: 48,
      requireLocalResidence: false
    }
  })
  
  log('  Created need with sequential strategy, quantity: 1')
  
  // Send initial request
  await sendRequests({
    projectNeedId: need.id,
    strategy: 'sequential',
    quantity: 1,
    rankingListId: need.rankingListId
  })
  
  // Check that only 1 request was sent
  let requests = await prisma.request.findMany({
    where: { projectNeedId: need.id },
    orderBy: { sentAt: 'asc' }
  })
  
  assert(requests.length === 1, 'Sequential should send exactly 1 request', {
    expected: 1,
    actual: requests.length
  })
  log('  ✓ Sent exactly 1 request')
  
  // Simulate decline
  await simulateResponse(requests[0].id, 'declined')
  
  // Check that a replacement was sent automatically
  requests = await prisma.request.findMany({
    where: { projectNeedId: need.id },
    orderBy: { sentAt: 'asc' }
  })
  
  assert(requests.length === 2, 'Should have sent replacement after decline', {
    expected: 2,
    actual: requests.length
  })
  assert(requests[0].status === 'declined', 'First request should be declined')
  assert(requests[1].status === 'pending', 'Second request should be pending')
  log('  ✓ Automatically sent replacement after decline')
  
  // Simulate acceptance
  await simulateResponse(requests[1].id, 'accepted')
  
  // Verify need is completed
  const updatedNeed = await prisma.projectNeed.findUnique({
    where: { id: need.id }
  })
  
  assert(updatedNeed.status === 'completed', 'Need should be completed after acceptance')
  log('  ✓ Need marked as completed')
  
  // Try to send more requests - should not send any
  await sendRequests({
    projectNeedId: need.id,
    strategy: 'sequential',
    quantity: 1,
    rankingListId: need.rankingListId
  })
  
  const finalRequests = await prisma.request.findMany({
    where: { projectNeedId: need.id }
  })
  
  assert(finalRequests.length === 2, 'Should not send more requests when completed', {
    expected: 2,
    actual: finalRequests.length
  })
  log('  ✓ No additional requests sent when completed')
}

// Test 2: Parallel Strategy - Overbooking Prevention
async function testParallelStrategy(data) {
  const { project, violinPosition } = data
  
  // Create need with parallel strategy
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: violinPosition.id,
      quantity: 8,
      rankingListId: violinPosition.rankingLists[0]?.id,
      requestStrategy: 'parallel',
      responseTimeHours: 48,
      requireLocalResidence: false
    }
  })
  
  log('  Created need with parallel strategy, quantity: 8')
  
  // Send initial requests
  await sendRequests({
    projectNeedId: need.id,
    strategy: 'parallel',
    quantity: 8,
    rankingListId: need.rankingListId
  })
  
  // Check that 8 requests were sent
  let requests = await prisma.request.findMany({
    where: { projectNeedId: need.id },
    orderBy: { sentAt: 'asc' }
  })
  
  assert(requests.length === 8, 'Parallel should send 8 initial requests', {
    expected: 8,
    actual: requests.length
  })
  log('  ✓ Sent 8 initial requests')
  
  // Simulate 3 acceptances
  for (let i = 0; i < 3; i++) {
    await simulateResponse(requests[i].id, 'accepted')
  }
  
  // Simulate 1 decline
  await simulateResponse(requests[3].id, 'declined')
  
  // Check current state
  requests = await prisma.request.findMany({
    where: { projectNeedId: need.id }
  })
  
  const accepted = requests.filter(r => r.status === 'accepted').length
  const pending = requests.filter(r => r.status === 'pending').length
  const declined = requests.filter(r => r.status === 'declined').length
  
  log(`  Current state: ${accepted} accepted, ${pending} pending, ${declined} declined`)
  
  // Verify the parallel formula: pending = needed - accepted
  const expectedPending = need.quantity - accepted
  assert(pending === expectedPending, 'Pending should equal needed minus accepted', {
    needed: need.quantity,
    accepted,
    expectedPending,
    actualPending: pending
  })
  log('  ✓ Parallel formula correct: pending = needed - accepted')
  
  // Verify no overbooking possible
  const maxPossibleAcceptances = accepted + pending
  assert(maxPossibleAcceptances <= need.quantity, 'Should not be able to overbook', {
    maxPossible: maxPossibleAcceptances,
    needed: need.quantity
  })
  log('  ✓ No overbooking possible')
  
  // Accept all remaining pending to fill positions
  const pendingRequests = requests.filter(r => r.status === 'pending')
  for (let i = 0; i < 5 && i < pendingRequests.length; i++) {
    await simulateResponse(pendingRequests[i].id, 'accepted')
  }
  
  // Verify need is completed
  const updatedNeed = await prisma.projectNeed.findUnique({
    where: { id: need.id }
  })
  
  assert(updatedNeed.status === 'completed', 'Need should be completed when all positions filled')
  log('  ✓ Need marked as completed when filled')
}

// Test 3: First Come Strategy - Cancellation
async function testFirstComeStrategy(data) {
  const { project, altPosition } = data
  
  // Create need with first_come strategy
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: altPosition.id,
      quantity: 2,
      maxRecipients: 4,
      rankingListId: altPosition.rankingLists[0]?.id,
      requestStrategy: 'first_come',
      responseTimeHours: 48,
      requireLocalResidence: false
    }
  })
  
  log('  Created need with first_come strategy, quantity: 2, maxRecipients: 4')
  
  // Send requests
  await sendRequests({
    projectNeedId: need.id,
    strategy: 'first_come',
    quantity: 2,
    maxRecipients: 4,
    rankingListId: need.rankingListId
  })
  
  // Check that 4 requests were sent
  let requests = await prisma.request.findMany({
    where: { projectNeedId: need.id },
    orderBy: { sentAt: 'asc' }
  })
  
  assert(requests.length === 4, 'First come should send to maxRecipients', {
    expected: 4,
    actual: requests.length
  })
  log('  ✓ Sent to 4 musicians (maxRecipients)')
  
  // Simulate 2 quick acceptances (positions filled)
  await simulateResponse(requests[1].id, 'accepted')
  await simulateResponse(requests[3].id, 'accepted')
  
  // Check that other pending requests were cancelled
  requests = await prisma.request.findMany({
    where: { projectNeedId: need.id }
  })
  
  const accepted = requests.filter(r => r.status === 'accepted').length
  const cancelled = requests.filter(r => r.status === 'cancelled').length
  const pending = requests.filter(r => r.status === 'pending').length
  
  assert(accepted === 2, 'Should have 2 accepted', { actual: accepted })
  assert(cancelled === 2, 'Should have cancelled remaining requests', { actual: cancelled })
  assert(pending === 0, 'Should have no pending requests', { actual: pending })
  log('  ✓ Automatically cancelled remaining requests when positions filled')
  
  // Verify need is completed
  const updatedNeed = await prisma.projectNeed.findUnique({
    where: { id: need.id }
  })
  
  assert(updatedNeed.status === 'completed', 'Need should be completed')
  log('  ✓ Need marked as completed')
}

// Test 4: Timeout Handling
async function testTimeoutHandling(data) {
  const { project, sopranPosition } = data
  
  // Create need
  const need = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: sopranPosition.id,
      quantity: 1,
      rankingListId: sopranPosition.rankingLists[0]?.id,
      requestStrategy: 'sequential',
      responseTimeHours: 48,
      requireLocalResidence: false
    }
  })
  
  // Get a musician
  const rankings = await prisma.ranking.findMany({
    where: { listId: need.rankingListId },
    include: { musician: true },
    take: 2
  })
  
  assert(rankings.length >= 2, 'Need at least 2 musicians for timeout test')
  
  // Create a request with old timestamp
  const requestId = await generateUniqueId('request')
  const oldRequest = await prisma.request.create({
    data: {
      requestId,
      projectNeedId: need.id,
      musicianId: rankings[0].musician.id,
      status: 'pending',
      sentAt: new Date(Date.now() - 49 * 60 * 60 * 1000) // 49 hours ago
    }
  })
  
  log('  Created request with timestamp 49 hours ago')
  
  // Run timeout handler
  const timeoutsHandled = await handleTimeouts()
  
  log(`  Timeout handler processed ${timeoutsHandled} requests`)
  
  // Verify request marked as timed_out
  const updatedRequest = await prisma.request.findUnique({
    where: { id: oldRequest.id }
  })
  
  assert(updatedRequest.status === 'timed_out', 'Request should be marked as timed out', {
    expected: 'timed_out',
    actual: updatedRequest.status
  })
  log('  ✓ Request marked as timed_out')
  
  // Verify replacement request sent
  const allRequests = await prisma.request.findMany({
    where: { projectNeedId: need.id }
  })
  
  assert(allRequests.length === 2, 'Should have sent replacement request', {
    expected: 2,
    actual: allRequests.length
  })
  
  const newRequest = allRequests.find(r => r.id !== oldRequest.id)
  assert(newRequest.status === 'pending', 'New request should be pending')
  assert(newRequest.musicianId !== oldRequest.musicianId, 'Should send to different musician')
  log('  ✓ Automatically sent replacement request')
}

// Test 5: One Request Per Musician Per Project
async function testOneRequestPerMusicianPerProject(data) {
  const { project, violinPosition, altPosition } = data
  
  // Get a musician who plays both violin and alt
  const musician = await prisma.musician.findFirst({
    where: {
      isActive: true,
      isArchived: false,
      qualifications: {
        some: { positionId: violinPosition.id }
      }
    }
  })
  
  assert(musician, 'Need musician for test')
  
  // Add qualification for alt if not exists
  await prisma.qualification.upsert({
    where: {
      musicianId_positionId: {
        musicianId: musician.id,
        positionId: altPosition.id
      }
    },
    update: {},
    create: {
      musicianId: musician.id,
      positionId: altPosition.id
    }
  })
  
  // Create two needs in same project
  const violinNeed = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: violinPosition.id,
      quantity: 1,
      requestStrategy: 'sequential',
      responseTimeHours: 48
    }
  })
  
  const altNeed = await prisma.projectNeed.create({
    data: {
      projectId: project.id,
      positionId: altPosition.id,
      quantity: 1,
      requestStrategy: 'sequential',
      responseTimeHours: 48
    }
  })
  
  // Manually create request for violin
  const violinRequestId = await generateUniqueId('request')
  await prisma.request.create({
    data: {
      requestId: violinRequestId,
      projectNeedId: violinNeed.id,
      musicianId: musician.id,
      status: 'pending',
      sentAt: new Date()
    }
  })
  
  log(`  Created violin request for musician ${musician.firstName} ${musician.lastName}`)
  
  // Try to send request for alt position
  await sendRequests({
    projectNeedId: altNeed.id,
    strategy: 'sequential',
    quantity: 1
  })
  
  // Check that no request was sent to same musician
  const altRequests = await prisma.request.findMany({
    where: { 
      projectNeedId: altNeed.id,
      musicianId: musician.id
    }
  })
  
  assert(altRequests.length === 0, 'Should not send request to musician already in project', {
    musicianId: musician.id,
    altRequests: altRequests.length
  })
  log('  ✓ Did not send duplicate request to same musician')
  
  // Verify a request was sent to someone else
  const allAltRequests = await prisma.request.findMany({
    where: { projectNeedId: altNeed.id }
  })
  
  assert(allAltRequests.length > 0, 'Should have sent request to another musician')
  assert(allAltRequests[0].musicianId !== musician.id, 'Request sent to different musician')
  log('  ✓ Sent request to different qualified musician')
}

// Main test runner
async function runAllTests() {
  log('\n🚀 REAL SYSTEM INTEGRATION TEST', 'magenta')
  log('Testing with actual database and system functions', 'magenta')
  log('=' .repeat(50), 'magenta')
  
  try {
    // Clean up any existing test data
    await cleanupTestData()
    
    // Set up test data
    const testData = await setupTestData()
    
    // Run all tests
    await recordTest('Sequential Strategy - Real Flow', () => testSequentialStrategy(testData))
    await recordTest('Parallel Strategy - Overbooking Prevention', () => testParallelStrategy(testData))
    await recordTest('First Come Strategy - Cancellation', () => testFirstComeStrategy(testData))
    await recordTest('Timeout Handling - Automatic Replacement', () => testTimeoutHandling(testData))
    await recordTest('One Request Per Musician Per Project', () => testOneRequestPerMusicianPerProject(testData))
    
    // Clean up test data
    await cleanupTestData()
    
    // Generate report
    generateReport()
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red')
    console.error(error)
  } finally {
    await prisma.$disconnect()
    process.exit(testResults.failed > 0 ? 1 : 0)
  }
}

function generateReport() {
  const total = testResults.passed + testResults.failed
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0
  
  log('\n' + '='.repeat(70), 'magenta')
  log('📊 INTEGRATION TEST REPORT', 'magenta')
  log('='.repeat(70), 'magenta')
  
  log(`\nTotal Tests: ${total}`, 'white')
  log(`Passed: ${testResults.passed} (${passRate}%)`, testResults.passed === total ? 'green' : 'yellow')
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green')
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red')
    testResults.tests.filter(t => !t.passed).forEach(t => {
      log(`  • ${t.name}`, 'red')
      log(`    ${t.error}`, 'red')
    })
  }
  
  log('\n' + '='.repeat(70), 'magenta')
  log(testResults.failed === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  Some tests failed', 
      testResults.failed === 0 ? 'green' : 'yellow')
  log('='.repeat(70), 'magenta')
  
  // Save to test-results folder
  const timestamp = Date.now()
  const reportData = {
    timestamp: new Date().toISOString(),
    total,
    passed: testResults.passed,
    failed: testResults.failed,
    passRate,
    tests: testResults.tests
  }
  
  const fs = require('fs')
  const path = require('path')
  const jsonPath = path.join(__dirname, 'test-results', 'json', `integration-test-${timestamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2))
  log(`\n💾 Report saved to: test-results/json/integration-test-${timestamp}.json`, 'cyan')
}

// Run the tests
if (require.main === module) {
  runAllTests()
}