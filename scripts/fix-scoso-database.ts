import { prisma } from '@/lib/prisma'

async function fixScoscoDatabase() {
  console.log('🔧 Fixar SCOSO databas-URL...\n')
  
  try {
    // Get the correct URL from environment
    // Note: SCOSO should use a different Supabase project ID
    const correctUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:BY%2z@RGq!%dk6v9@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    
    if (!correctUrl) {
      console.error('DATABASE_URL_SCOSO finns inte i .env.local!')
      return
    }
    
    // Update SCOSO orchestra
    const result = await prisma.orchestra.update({
      where: { subdomain: 'scosco' },
      data: { databaseUrl: correctUrl }
    })
    
    console.log('✅ Uppdaterat SCOSO databas:')
    console.log(`   Namn: ${result.name}`)
    console.log(`   Subdomän: ${result.subdomain}`)
    
    // Verify it's different from SCO
    const sco = await prisma.orchestra.findUnique({
      where: { subdomain: 'sco' },
      select: { databaseUrl: true }
    })
    
    const scoso = await prisma.orchestra.findUnique({
      where: { subdomain: 'scosco' },
      select: { databaseUrl: true }
    })
    
    if (sco?.databaseUrl === scoso?.databaseUrl) {
      console.error('\n❌ VARNING: SCO och SCOSO använder fortfarande samma databas!')
    } else {
      console.log('\n✅ SCO och SCOSO använder nu olika databaser!')
      
      // Extract project IDs to show they're different
      const scoProject = sco?.databaseUrl?.match(/postgres\.(\w+):/)?.[1]
      const scosoProject = scoso?.databaseUrl?.match(/postgres\.(\w+):/)?.[1]
      
      console.log(`   SCO projekt: ${scoProject}`)
      console.log(`   SCOSO projekt: ${scosoProject}`)
    }
    
  } catch (error) {
    console.error('Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixScoscoDatabase()