import { createSuperadminUser } from '../lib/auth-db'

async function main() {
  console.log('Creating superadmin user...')
  await createSuperadminUser()
  console.log('Done!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})