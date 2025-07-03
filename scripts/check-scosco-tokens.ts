import { PrismaClient } from '@prisma/client'

// Direct connection to SCOSCO database
const scoscoPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_SCOSO || 'postgresql://postgres.hqzrqnsvhyfypqklgoas:7N7AgCT*%23Shs_KrYP3_2-sdfDM%3D%2Bp7V%25@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
})

async function checkTokens() {
  console.log('=== Checking tokens in SCOSCO database ===\n')
  
  try {
    // Count total tokens
    const tokenCount = await scoscoPrisma.requestToken.count()
    console.log(`Total tokens: ${tokenCount}`)
    
    // List all tokens
    const tokens = await scoscoPrisma.requestToken.findMany({
      include: {
        request: {
          include: {
            musician: true,
            projectNeed: {
              include: {
                project: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\nTokens found:`)
    tokens.forEach((token, index) => {
      console.log(`\n${index + 1}. Token: ${token.token}`)
      console.log(`   ID: ${token.id}`)
      console.log(`   Request ID: ${token.requestId}`)
      console.log(`   Created: ${token.createdAt.toISOString()}`)
      console.log(`   Expires: ${token.expiresAt.toISOString()}`)
      console.log(`   Used: ${token.usedAt ? token.usedAt.toISOString() : 'No'}`)
      console.log(`   Musician: ${token.request.musician.firstName} ${token.request.musician.lastName}`)
      console.log(`   Project: ${token.request.projectNeed.project.name}`)
      console.log(`   Position: ${token.request.projectNeed.position.name}`)
      console.log(`   Status: ${token.request.status}`)
    })
    
    // Check if a specific token exists
    const searchToken = process.argv[2]
    if (searchToken) {
      console.log(`\n\nSearching for specific token: ${searchToken}`)
      const found = await scoscoPrisma.requestToken.findUnique({
        where: { token: searchToken },
        include: {
          request: {
            include: {
              musician: true,
              projectNeed: {
                include: {
                  project: true
                }
              }
            }
          }
        }
      })
      
      if (found) {
        console.log('✅ TOKEN FOUND!')
        console.log(JSON.stringify(found, null, 2))
      } else {
        console.log('❌ TOKEN NOT FOUND')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await scoscoPrisma.$disconnect()
  }
}

checkTokens()