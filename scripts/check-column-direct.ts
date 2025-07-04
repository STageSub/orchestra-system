import { PrismaClient } from '@prisma/client'

async function checkColumn() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.GOTEBORG_DATABASE_URL || process.env.SUPABASE_URL || process.env.DATABASE_URL
      }
    }
  })

  try {
    // Method 1: Try to query with the column
    console.log('Method 1: Querying with requireLocalResidence column...')
    try {
      const result = await prisma.$queryRaw`
        SELECT id, "projectNeedId", "requireLocalResidence" 
        FROM "ProjectNeed" 
        LIMIT 1
      `
      console.log('✅ Column exists! Sample data:', result)
    } catch (error: any) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Column does not exist:', error.message)
      } else {
        console.log('❌ Other error:', error.message)
      }
    }

    // Method 2: Check information schema
    console.log('\nMethod 2: Checking information_schema...')
    const columns: any = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ProjectNeed' 
      AND column_name = 'requireLocalResidence'
    `
    
    if (columns.length > 0) {
      console.log('✅ Column found in schema:', columns[0])
    } else {
      console.log('❌ Column not found in information_schema')
    }

    // Method 3: Get all columns
    console.log('\nMethod 3: All columns in ProjectNeed table:')
    const allColumns: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProjectNeed'
      ORDER BY ordinal_position
    `
    
    console.log('Columns:')
    allColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`)
    })

    // Method 4: Try to create a ProjectNeed with the field
    console.log('\nMethod 4: Testing Prisma model...')
    try {
      // First, get required IDs
      const project = await prisma.project.findFirst()
      const position = await prisma.position.findFirst()
      
      if (project && position) {
        const testNeed = await prisma.projectNeed.create({
          data: {
            projectId: project.id,
            positionId: position.id,
            quantity: 1,
            requestStrategy: 'sequential',
            requireLocalResidence: true, // Testing this field
            status: 'active'
          },
          select: {
            id: true,
            requireLocalResidence: true
          }
        })
        
        console.log('✅ Successfully created ProjectNeed with requireLocalResidence:', testNeed)
        
        // Clean up
        await prisma.projectNeed.delete({ where: { id: testNeed.id } })
      } else {
        console.log('⚠️  No project or position found to test with')
      }
    } catch (error: any) {
      console.log('❌ Error creating ProjectNeed:', error.message)
    }

  } finally {
    await prisma.$disconnect()
  }
}

checkColumn().catch(console.error)