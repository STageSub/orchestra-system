#!/usr/bin/env node

/**
 * Master Dummy Data Creation Script
 * Creates complete test dataset in proper sequence
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

function runScript(scriptName, description) {
  log(`\n🚀 ${description}`, 'cyan')
  try {
    execSync(`node scripts/${scriptName}`, { stdio: 'inherit' })
    log(`✅ ${description} completed`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red')
    return false
  }
}

async function createAllDummyData() {
  log('🎼 COMPLETE DUMMY DATA CREATION', 'magenta')
  log('================================', 'magenta')
  log('This will create a complete test dataset for the Orchestra System', 'yellow')
  
  const startTime = Date.now()
  const results = []
  
  // 1. Reset database and create orchestra structure
  results.push({
    step: 'Database reset and orchestra creation',
    success: runScript('reset-orchestra-data.js', 'Resetting database and creating orchestra structure')
  })
  
  // 2. Add archived musicians
  results.push({
    step: 'Add archived musicians',
    success: runScript('add-archived-musicians.js', 'Adding archived musicians')
  })
  
  // 3. Add singers
  results.push({
    step: 'Add singers',
    success: runScript('add-singers.js', 'Adding choir singers (Sopran, Alt, Tenor, Bas)')
  })
  
  // 4. Update email addresses to test domain
  results.push({
    step: 'Update email addresses',
    success: runScript('update-emails.js', 'Updating emails to @stagesubtest.com')
  })
  
  // 5. Create completed projects (historical data)
  results.push({
    step: 'Create completed projects',
    success: runScript('create-completed-projects.js', 'Creating historical projects with request history')
  })
  
  // 6. Create upcoming test projects
  results.push({
    step: 'Create upcoming projects',
    success: runScript('create-test-projects.js', 'Creating upcoming test projects')
  })
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  log('\n' + '='.repeat(70), 'magenta')
  log('🎉 DUMMY DATA CREATION COMPLETE', 'magenta')
  log('='.repeat(70), 'magenta')
  
  log('\n📊 Summary:', 'blue')
  log(`  Total steps: ${results.length}`)
  log(`  Successful: ${successful}`, successful === results.length ? 'green' : 'yellow')
  if (failed > 0) {
    log(`  Failed: ${failed}`, 'red')
    log('\n❌ Failed steps:', 'red')
    results.filter(r => !r.success).forEach(r => {
      log(`  • ${r.step}`, 'red')
    })
  }
  log(`  Duration: ${duration} seconds`)
  
  // Save configuration for reproducibility
  const config = {
    createdAt: new Date().toISOString(),
    version: '1.0',
    steps: results,
    duration: duration,
    environment: {
      node: process.version,
      platform: process.platform
    }
  }
  
  const configPath = path.join(__dirname, 'dummy-data-run.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  log(`\n💾 Run configuration saved to: ${configPath}`, 'cyan')
  
  if (successful === results.length) {
    log('\n✅ All dummy data created successfully!', 'green')
    log('You can now run tests with a complete dataset.', 'green')
  } else {
    log('\n⚠️  Some steps failed. Please check the errors above.', 'yellow')
  }
}

// Run the script
if (require.main === module) {
  createAllDummyData()
}