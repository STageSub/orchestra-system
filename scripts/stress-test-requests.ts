#!/usr/bin/env ts-node

const { prisma } = require('../lib/prisma')
const { runAllScenarios } = require('./test-scenarios')
const { setupTestEnvironment, cleanupTestData, generateTestId } = require('./test-helpers')
const { initializeEmailMock, getEmailReport } = require('./test-email-mock')
const { generateTestReport } = require('./test-report-generator')

interface TestOptions {
  category?: string
  scenario?: string
  verbose?: boolean
  noCleanup?: boolean
  reportFormat?: 'console' | 'html' | 'json'
}

interface TestResult {
  category: string
  scenario: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

// Parse command line arguments
function parseArgs(): TestOptions {
  const args = process.argv.slice(2)
  const options: TestOptions = {
    verbose: false,
    noCleanup: false,
    reportFormat: 'console'
  }

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      switch (key) {
        case 'category':
          options.category = value
          break
        case 'scenario':
          options.scenario = value
          break
        case 'verbose':
          options.verbose = true
          break
        case 'no-cleanup':
          options.noCleanup = true
          break
        case 'report':
          options.reportFormat = value as any
          break
      }
    }
  })

  return options
}

async function main() {
  const startTime = Date.now()
  const options = parseArgs()
  const testId = generateTestId()
  
  console.log('🚀 Orchestra System Stress Test')
  console.log('================================')
  console.log(`Test ID: ${testId}`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Options:`, options)
  console.log('')

  const results: TestResult[] = []
  
  try {
    // Setup
    console.log('📋 Setting up test environment...')
    await setupTestEnvironment(testId)
    
    // Initialize email mock
    console.log('📧 Initializing email mock...')
    initializeEmailMock()
    
    // Run tests
    console.log('🏃 Running test scenarios...')
    console.log('')
    
    const scenarios = await runAllScenarios({
      testId,
      categoryFilter: options.category,
      scenarioFilter: options.scenario,
      verbose: options.verbose || false
    })
    
    // Collect results
    for (const result of scenarios) {
      results.push(result)
      
      if (options.verbose || !result.passed) {
        console.log(`${result.passed ? '✅' : '❌'} ${result.category} - ${result.scenario}`)
        if (!result.passed && result.error) {
          console.log(`   Error: ${result.error}`)
        }
        if (options.verbose && result.details) {
          console.log(`   Details:`, result.details)
        }
      }
    }
    
    // Generate report
    console.log('')
    console.log('📊 Generating report...')
    
    const emailReport = getEmailReport()
    const totalDuration = Date.now() - startTime
    
    await generateTestReport({
      testId,
      results,
      emailReport,
      totalDuration,
      format: options.reportFormat || 'console'
    })
    
    // Cleanup
    if (!options.noCleanup) {
      console.log('')
      console.log('🧹 Cleaning up test data...')
      await cleanupTestData(testId)
    } else {
      console.log('')
      console.log('⚠️  Test data preserved (--no-cleanup flag)')
      console.log(`   Test ID: ${testId}`)
    }
    
    // Summary
    const passed = results.filter(r => r.passed).length
    const failed = results.length - passed
    const passRate = ((passed / results.length) * 100).toFixed(1)
    
    console.log('')
    console.log('📈 Summary')
    console.log('==========')
    console.log(`Total tests: ${results.length}`)
    console.log(`Passed: ${passed} (${passRate}%)`)
    console.log(`Failed: ${failed}`)
    console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`)
    
    // Exit code
    process.exit(failed > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('')
    console.error('💥 Fatal error during test execution:')
    console.error(error)
    
    // Try to cleanup even on error
    if (!options.noCleanup) {
      try {
        console.error('Attempting cleanup...')
        await cleanupTestData(testId)
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }
    }
    
    process.exit(2)
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  process.exit(3)
})

process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user')
  process.exit(130)
})

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to run stress test:', error)
    process.exit(4)
  })
}

module.exports = { runStressTest: main }