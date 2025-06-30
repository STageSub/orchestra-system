#!/usr/bin/env node

/**
 * Populate ranking lists with musicians
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function populateRankings() {
  console.log('🏆 Populating ranking lists...')
  
  try {
    // Get all positions
    const positions = await prisma.position.findMany({
      include: {
        rankingLists: true
      }
    })
    
    let totalRankings = 0
    
    for (const position of positions) {
      // Get all musicians qualified for this position
      const qualifiedMusicians = await prisma.musician.findMany({
        where: {
          qualifications: {
            some: {
              positionId: position.id
            }
          }
        }
      })
      
      if (qualifiedMusicians.length === 0) continue
      
      // Get ranking lists for this position
      const lists = position.rankingLists
      const aList = lists.find(l => l.listType === 'A')
      const bList = lists.find(l => l.listType === 'B')
      const cList = lists.find(l => l.listType === 'C')
      
      // Shuffle musicians
      const shuffled = qualifiedMusicians.sort(() => Math.random() - 0.5)
      
      // Simple distribution with overlap
      const totalMusicians = shuffled.length
      
      // A list - 60% of musicians
      if (aList) {
        const aSize = Math.ceil(totalMusicians * 0.6)
        for (let i = 0; i < aSize && i < totalMusicians; i++) {
          await prisma.ranking.create({
            data: {
              listId: aList.id,
              musicianId: shuffled[i].id,
              rank: i + 1
            }
          })
          totalRankings++
        }
      }
      
      // B list - 70% starting from 30% into the list (overlap with A)
      if (bList) {
        const bStart = Math.floor(totalMusicians * 0.3)
        const bSize = Math.ceil(totalMusicians * 0.7)
        for (let i = 0; i < bSize && (bStart + i) < totalMusicians; i++) {
          await prisma.ranking.create({
            data: {
              listId: bList.id,
              musicianId: shuffled[bStart + i].id,
              rank: i + 1
            }
          })
          totalRankings++
        }
      }
      
      // C list - 50% from the bottom half (some overlap with B)
      if (cList) {
        const cStart = Math.floor(totalMusicians * 0.4)
        const cSize = Math.ceil(totalMusicians * 0.5)
        for (let i = 0; i < cSize && (cStart + i) < totalMusicians; i++) {
          await prisma.ranking.create({
            data: {
              listId: cList.id,
              musicianId: shuffled[cStart + i].id,
              rank: i + 1
            }
          })
          totalRankings++
        }
      }
      
      console.log(`  ✓ Populated lists for ${position.name}`)
    }
    
    console.log(`\n✅ Created ${totalRankings} ranking entries`)
    
    // Show overlap statistics
    const musiciansOnMultipleLists = await prisma.$queryRaw`
      SELECT 
        m."firstName",
        m."lastName",
        COUNT(DISTINCT r."listId") as list_count
      FROM "Musician" m
      JOIN "Ranking" r ON r."musicianId" = m.id
      GROUP BY m.id, m."firstName", m."lastName"
      HAVING COUNT(DISTINCT r."listId") > 1
      ORDER BY list_count DESC
      LIMIT 10
    `
    
    console.log(`\n📊 Musicians on multiple lists: ${musiciansOnMultipleLists.length}`)
    musiciansOnMultipleLists.forEach(m => {
      console.log(`  • ${m.firstName} ${m.lastName}: ${m.list_count} lists`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  populateRankings()
}