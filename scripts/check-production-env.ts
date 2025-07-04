// This script helps verify that all required environment variables are set
// Run this locally with your production .env file to check configuration

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_PASSWORD',
  'SUPERADMIN_PASSWORD',
  'NODE_ENV',
  'RESEND_API_KEY',
  'DATABASE_URL_SCO',
  'DATABASE_URL_SCOSCO'
]

const optionalEnvVars = [
  'SUPABASE_MANAGEMENT_TOKEN',
  'SUPABASE_ORGANIZATION_ID',
  'DATABASE_URL_POOL_1',
  'DATABASE_URL_POOL_2'
]

console.log('🔍 Checking Environment Variables...\n')

console.log('Required Variables:')
console.log('─'.repeat(50))

let missingRequired = 0
for (const varName of requiredEnvVars) {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set (length: ${value.length})`)
    
    // Special checks
    if (varName === 'DATABASE_URL' && !value.includes('neon')) {
      console.log(`   ⚠️  Warning: DATABASE_URL should point to Neon database`)
    }
    if (varName === 'NODE_ENV' && value !== 'production') {
      console.log(`   ⚠️  Warning: NODE_ENV should be 'production' in production`)
    }
    if (varName === 'JWT_SECRET' && value.length < 32) {
      console.log(`   ⚠️  Warning: JWT_SECRET should be at least 32 characters`)
    }
  } else {
    console.log(`❌ ${varName}: Missing`)
    missingRequired++
  }
}

console.log('\nOptional Variables:')
console.log('─'.repeat(50))

for (const varName of optionalEnvVars) {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set`)
  } else {
    console.log(`ℹ️  ${varName}: Not set (optional)`)
  }
}

console.log('\nSummary:')
console.log('─'.repeat(50))

if (missingRequired === 0) {
  console.log('✅ All required environment variables are set!')
} else {
  console.log(`❌ Missing ${missingRequired} required environment variables`)
  console.log('\nTo fix this:')
  console.log('1. Check your .env.production file')
  console.log('2. Ensure all variables are set in Vercel dashboard')
  console.log('3. Redeploy after adding missing variables')
}

// Check for common issues
console.log('\n🔍 Common Issues Check:')
console.log('─'.repeat(50))

// Check passwords
if (process.env.ADMIN_PASSWORD === process.env.SUPERADMIN_PASSWORD) {
  console.log('⚠️  Warning: ADMIN_PASSWORD and SUPERADMIN_PASSWORD are the same')
}

// Check database URLs
const dbUrls = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_SCO,
  process.env.DATABASE_URL_SCOSCO
].filter(Boolean)

const uniqueDbUrls = new Set(dbUrls)
if (uniqueDbUrls.size < dbUrls.length) {
  console.log('❌ Error: Some database URLs are duplicated! Each orchestra needs its own database.')
} else {
  console.log('✅ All database URLs are unique')
}

console.log('\n💡 Next Steps:')
console.log('1. If using Vercel, go to: Settings → Environment Variables')
console.log('2. Add any missing variables')
console.log('3. Redeploy your application')
console.log('4. Test login with debug endpoint: /api/auth/test-env')