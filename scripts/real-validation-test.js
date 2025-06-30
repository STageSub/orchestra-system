#!/usr/bin/env node

/**
 * Real Validation Test
 * 
 * Tests all business rule validations using the actual system
 * Focuses on what SHOULD fail but might not be properly validated
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Test configuration
const TEST_PREFIX = 'VALIDATION-TEST-'

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
  findings: [],
  tests: []
}

async function recordTest(name, fn) {
  log(`\n📋 Testing: ${name}`, 'yellow')
  const startTime = Date.now()
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    
    if (result.validationWorking) {
      testResults.passed++
      testResults.tests.push({ name, passed: true, duration })
      log(`✅ VALIDATION WORKING: ${result.message}`, 'green')
    } else {
      testResults.failed++
      testResults.tests.push({ name, passed: false, duration, issue: result.message })
      testResults.findings.push({
        test: name,
        issue: result.message,
        severity: result.severity || 'high'
      })
      log(`❌ VALIDATION MISSING: ${result.message}`, 'red')
    }
    
    if (result.details) {
      log(`   Details: ${JSON.stringify(result.details)}`, 'cyan')
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.failed++
    testResults.tests.push({ name, passed: false, duration, error: error.message })
    log(`💥 ERROR: ${error.message}`, 'red')
  }
}

// Clean up test data
async function cleanupTestData() {
  await prisma.project.deleteMany({
    where: {
      projectId: {
        startsWith: TEST_PREFIX
      }
    }
  })
}

// Test 1: Sequential Strategy Must Have Quantity = 1
async function testSequentialQuantityValidation() {
  const project = await prisma.project.create({
    data: {
      projectId: `${TEST_PREFIX}SEQ-001`,
      name: 'Sequential Validation Test',
      startDate: new Date('2025-08-01'),
      weekNumber: 31
    }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Sopran' }
  })
  
  try {
    // Try to create sequential need with quantity > 1
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 3,  // This SHOULD be invalid
        requestStrategy: 'sequential',
        responseTimeHours: 48
      }
    })
    
    // If we get here, validation is NOT working
    return {
      validationWorking: false,
      message: 'Sequential strategy allows quantity > 1',
      severity: 'critical',
      details: {
        created: true,
        needId: need.id,
        quantity: need.quantity
      }
    }
  } catch (error) {
    // This is what we want - validation should prevent this
    return {
      validationWorking: true,
      message: 'Sequential strategy correctly enforces quantity = 1',
      details: {
        errorMessage: error.message
      }
    }
  }
}

// Test 2: First Come Strategy Should Require MaxRecipients
async function testFirstComeMaxRecipientsValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Alt' }
  })
  
  try {
    // Try to create first_come need without maxRecipients
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 2,
        requestStrategy: 'first_come',
        responseTimeHours: 48
        // No maxRecipients - should this be allowed?
      }
    })
    
    if (need.maxRecipients === null) {
      return {
        validationWorking: false,
        message: 'First come strategy allows null maxRecipients',
        severity: 'high',
        details: {
          created: true,
          maxRecipients: null,
          note: 'This could send to ALL musicians if not handled'
        }
      }
    } else {
      return {
        validationWorking: true,
        message: 'First come strategy has default maxRecipients',
        details: {
          defaultValue: need.maxRecipients
        }
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'First come strategy requires maxRecipients',
      details: {
        errorMessage: error.message
      }
    }
  }
}

// Test 3: MaxRecipients Must Be >= Quantity
async function testMaxRecipientsMinimumValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Tenor' }
  })
  
  try {
    // Try to create first_come with maxRecipients < quantity
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 5,
        maxRecipients: 3,  // Less than quantity!
        requestStrategy: 'first_come',
        responseTimeHours: 48
      }
    })
    
    // If created, this is a serious issue
    return {
      validationWorking: false,
      message: 'First come allows maxRecipients < quantity',
      severity: 'critical',
      details: {
        quantity: need.quantity,
        maxRecipients: need.maxRecipients,
        issue: 'Can never fill all positions!'
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'MaxRecipients must be >= quantity',
      details: {
        errorMessage: error.message
      }
    }
  }
}

// Test 4: Response Time Hours Must Be Positive
async function testResponseTimeValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Bas' }
  })
  
  try {
    // Try negative response time
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 1,
        requestStrategy: 'sequential',
        responseTimeHours: -24  // Negative!
      }
    })
    
    return {
      validationWorking: false,
      message: 'Allows negative response time',
      severity: 'high',
      details: {
        responseTimeHours: need.responseTimeHours
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'Response time must be positive'
    }
  }
}

// Test 5: Quantity Must Be Positive
async function testQuantityValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Tutti violin 1' }
  })
  
  try {
    // Try zero quantity
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 0,  // Zero!
        requestStrategy: 'parallel',
        responseTimeHours: 48
      }
    })
    
    return {
      validationWorking: false,
      message: 'Allows zero quantity',
      severity: 'high',
      details: {
        quantity: need.quantity
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'Quantity must be positive'
    }
  }
}

// Test 6: Strategy Must Be Valid Enum
async function testStrategyEnumValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Tutti viola' }
  })
  
  try {
    // Try invalid strategy
    const need = await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 2,
        requestStrategy: 'random',  // Invalid!
        responseTimeHours: 48
      }
    })
    
    return {
      validationWorking: false,
      message: 'Allows invalid request strategy',
      severity: 'critical',
      details: {
        strategy: need.requestStrategy
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'Strategy must be valid enum value'
    }
  }
}

// Test 7: Duplicate Position in Same Project
async function testDuplicatePositionValidation() {
  const project = await prisma.project.findFirst({
    where: { projectId: { startsWith: TEST_PREFIX } }
  })
  
  const position = await prisma.position.findFirst({
    where: { name: 'Solohorn' }
  })
  
  try {
    // Create first need
    await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,
        quantity: 1,
        requestStrategy: 'sequential',
        responseTimeHours: 48
      }
    })
    
    // Try to create duplicate
    await prisma.projectNeed.create({
      data: {
        projectId: project.id,
        positionId: position.id,  // Same position!
        quantity: 1,
        requestStrategy: 'sequential',
        responseTimeHours: 48
      }
    })
    
    return {
      validationWorking: false,
      message: 'Allows duplicate positions in same project',
      severity: 'medium',
      details: {
        position: position.name,
        note: 'Could confuse musicians and create conflicts'
      }
    }
  } catch (error) {
    return {
      validationWorking: true,
      message: 'Prevents duplicate positions in project'
    }
  }
}

// Test 8: Past Project Start Date
async function testPastStartDateValidation() {
  try {
    // Try to create project with past date
    const project = await prisma.project.create({
      data: {
        projectId: `${TEST_PREFIX}PAST-001`,
        name: 'Past Date Test',
        startDate: new Date('2020-01-01'),  // Way in the past!
        weekNumber: 1
      }
    })
    
    // Check if it's automatically marked as completed
    const status = project.startDate < new Date() ? 'completed' : 'upcoming'
    
    return {
      validationWorking: true,
      message: 'Past dates are allowed (for historical data)',
      details: {
        created: true,
        autoStatus: status
      }
    }
  } catch (error) {
    return {
      validationWorking: false,
      message: 'Rejects past start dates',
      details: {
        note: 'This might be too restrictive'
      }
    }
  }
}

// Main test runner
async function runAllTests() {
  log('\n🚀 REAL VALIDATION TEST', 'magenta')
  log('Testing business rule validations in the actual system', 'magenta')
  log('=' .repeat(50), 'magenta')
  
  try {
    // Clean up any existing test data
    await cleanupTestData()
    
    // Run all validation tests
    await recordTest('Sequential Strategy Quantity = 1', testSequentialQuantityValidation)
    await recordTest('First Come Requires MaxRecipients', testFirstComeMaxRecipientsValidation)
    await recordTest('MaxRecipients >= Quantity', testMaxRecipientsMinimumValidation)
    await recordTest('Response Time Must Be Positive', testResponseTimeValidation)
    await recordTest('Quantity Must Be Positive', testQuantityValidation)
    await recordTest('Strategy Must Be Valid Enum', testStrategyEnumValidation)
    await recordTest('No Duplicate Positions in Project', testDuplicatePositionValidation)
    await recordTest('Past Project Start Date Handling', testPastStartDateValidation)
    
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
  
  log('\n' + '='.repeat(70), 'magenta')
  log('📊 VALIDATION TEST REPORT', 'magenta')
  log('='.repeat(70), 'magenta')
  
  log(`\nTotal Tests: ${total}`, 'white')
  log(`Working Validations: ${testResults.passed}`, 'green')
  log(`Missing Validations: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green')
  
  if (testResults.findings.length > 0) {
    log('\n🚨 CRITICAL FINDINGS:', 'red')
    testResults.findings.forEach((finding, i) => {
      log(`\n${i + 1}. ${finding.test}`, 'yellow')
      log(`   Issue: ${finding.issue}`, 'red')
      log(`   Severity: ${finding.severity.toUpperCase()}`, 
          finding.severity === 'critical' ? 'red' : 'yellow')
    })
    
    log('\n📋 REQUIRED FIXES:', 'blue')
    log('1. Add validation in ProjectNeed creation API')
    log('2. Add database constraints where possible')
    log('3. Update UI to enforce rules before submission')
  }
  
  log('\n' + '='.repeat(70), 'magenta')
  
  if (testResults.failed === 0) {
    log('✅ ALL VALIDATIONS WORKING!', 'green')
  } else {
    log(`⚠️  ${testResults.failed} VALIDATIONS MISSING - NOT PRODUCTION READY`, 'red')
  }
  
  log('='.repeat(70), 'magenta')
  
  // Save results
  const fs = require('fs')
  const timestamp = Date.now()
  const reportData = {
    timestamp: new Date().toISOString(),
    total,
    workingValidations: testResults.passed,
    missingValidations: testResults.failed,
    findings: testResults.findings,
    tests: testResults.tests
  }
  
  fs.writeFileSync(
    `test-results/json/validation-test-${timestamp}.json`,
    JSON.stringify(reportData, null, 2)
  )
  
  log(`\n💾 Report saved to: test-results/json/validation-test-${timestamp}.json`, 'cyan')
}

// Run the tests
if (require.main === module) {
  runAllTests()
}