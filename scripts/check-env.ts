import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

console.log('Checking environment variables...\n')

const vars = [
  'DATABASE_URL_SCO',
  'DATABASE_URL_SCOSO', 
  'DATABASE_URL_GOTEBORG',
  'DATABASE_URL_STOCKHOLM',
  'DATABASE_URL_MALMO'
]

for (const varName of vars) {
  const value = process.env[varName]
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`)
  if (value) {
    console.log(`  -> ${value.substring(0, 50)}...`)
  }
}