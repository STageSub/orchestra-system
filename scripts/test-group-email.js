// Test script for group email functionality
// Run with: node scripts/test-group-email.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testGroupEmail() {
  try {
    console.log('=== Testing Group Email Functionality ===\n')
    
    // 1. Get a test project
    const project = await prisma.project.findFirst({
      where: { id: 4 }  // Use ID instead of name to avoid issues
    })
    
    if (!project) {
      console.log('❌ No test project found')
      return
    }
    
    console.log(`✅ Found project: ${project.name} (ID: ${project.id})`)
    
    // 2. Check for accepted requests
    const acceptedRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: project.id
        },
        status: 'accepted'
      },
      include: {
        musician: true,
        projectNeed: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      }
    })
    
    console.log(`\n📊 Accepted requests: ${acceptedRequests.length}`)
    
    if (acceptedRequests.length === 0) {
      console.log('\n⚠️  No accepted requests found. Creating test data...')
      
      // Find a pending request to accept
      const pendingRequest = await prisma.request.findFirst({
        where: {
          projectNeed: {
            projectId: project.id
          },
          status: 'pending'
        },
        include: {
          musician: true
        }
      })
      
      if (pendingRequest) {
        await prisma.request.update({
          where: { id: pendingRequest.id },
          data: {
            status: 'accepted',
            respondedAt: new Date()
          }
        })
        console.log(`✅ Updated request for ${pendingRequest.musician.firstName} ${pendingRequest.musician.lastName} to accepted`)
      }
    }
    
    // 3. Test the group email query
    const musicians = await prisma.musician.findMany({
      where: {
        isActive: true,
        requests: {
          some: {
            projectNeed: {
              projectId: project.id
            },
            status: 'accepted'
          }
        }
      },
      include: {
        requests: {
          where: {
            projectNeed: {
              projectId: project.id
            },
            status: 'accepted'
          },
          include: {
            projectNeed: {
              include: {
                position: {
                  include: {
                    instrument: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    console.log(`\n📧 Musicians for group email: ${musicians.length}`)
    
    musicians.forEach((musician, index) => {
      console.log(`\n${index + 1}. ${musician.firstName} ${musician.lastName} (${musician.email})`)
      musician.requests.forEach(req => {
        console.log(`   - ${req.projectNeed.position.instrument.name} - ${req.projectNeed.position.name}`)
      })
    })
    
    // 4. Check instrument data types
    const instruments = await prisma.instrument.findMany({
      take: 3
    })
    
    console.log('\n🎻 Instrument data types:')
    instruments.forEach(inst => {
      console.log(`   - ID: ${inst.id} (type: ${typeof inst.id}), Name: ${inst.name}`)
    })
    
    console.log('\n✨ Test complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testGroupEmail()