const { PrismaClient } = require('@prisma/client')

async function checkScosoTemplates() {
  // SCOSO database URL with encoded special characters
  const databaseUrl = 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  try {
    console.log('Connecting to SCOSO database...')
    
    // Get all templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' }
    })
    
    console.log(`\nFound ${templates.length} templates:\n`)
    
    templates.forEach(template => {
      console.log(`Template: ${template.type}`)
      console.log(`- ID: ${template.emailTemplateId}`)
      console.log(`- Subject: ${template.subject}`)
      console.log(`- Variables: ${template.variables.join(', ')}`)
      console.log('')
    })
    
    // Check specifically for 'request' template
    const requestTemplate = await prisma.emailTemplate.findUnique({
      where: { type: 'request' }
    })
    
    if (!requestTemplate) {
      console.log('⚠️  WARNING: "request" template NOT FOUND!')
    } else {
      console.log('✅ "request" template exists')
    }
    
  } catch (error) {
    console.error('❌ Error checking templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkScosoTemplates()
  .then(() => {
    console.log('\n✅ Template check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Template check failed:', error)
    process.exit(1)
  })