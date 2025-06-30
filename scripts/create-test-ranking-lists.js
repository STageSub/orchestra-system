const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createMissingRankingLists() {
  console.log('Creating missing ranking lists...')
  
  // Get all positions
  const positions = await prisma.position.findMany({
    include: { instrument: true }
  })
  
  for (const position of positions) {
    // Check if ranking list exists
    const existingList = await prisma.rankingList.findFirst({
      where: {
        positionId: position.id,
        listType: 'A'
      }
    })
    
    if (!existingList) {
      // Create A list for positions that need them
      if (position.name === 'Tutti' && position.instrument.name === 'Cello') {
        console.log(`Creating A list for ${position.name} (${position.instrument.name})`)
        await prisma.rankingList.create({
          data: {
            positionId: position.id,
            listType: 'A',
            description: 'A-lista'
          }
        })
      }
    }
  }
  
  await prisma.$disconnect()
  console.log('Done!')
}

createMissingRankingLists().catch(console.error)