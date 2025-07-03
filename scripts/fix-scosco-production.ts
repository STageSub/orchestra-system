import { neonPrisma } from '@/lib/prisma-dynamic'

async function fixScoscoProduction() {
  console.log('🔧 Fixing SCOSCO database URL in production...\n')
  
  try {
    // First, check current state
    const scosco = await neonPrisma.orchestra.findUnique({
      where: { subdomain: 'scosco' },
      select: { 
        id: true,
        name: true, 
        subdomain: true, 
        databaseUrl: true,
        status: true 
      }
    })
    
    console.log('Current SCOSCO orchestra:', scosco)
    
    if (!scosco) {
      console.error('❌ SCOSCO orchestra not found!')
      return
    }
    
    // The correct SCOSCO database URL
    const correctUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    
    if (scosco.databaseUrl === correctUrl) {
      console.log('✅ SCOSCO already has the correct database URL')
      return
    }
    
    // Update with correct URL
    const updated = await neonPrisma.orchestra.update({
      where: { subdomain: 'scosco' },
      data: { 
        databaseUrl: correctUrl,
        status: 'active' // Ensure it's active
      }
    })
    
    console.log('✅ Updated SCOSCO orchestra:')
    console.log(`   Name: ${updated.name}`)
    console.log(`   Subdomain: ${updated.subdomain}`)
    console.log(`   Status: ${updated.status}`)
    console.log(`   Database URL: ${updated.databaseUrl ? 'Set correctly' : 'NOT SET'}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await neonPrisma.$disconnect()
  }
}

// Run the fix
fixScoscoProduction()