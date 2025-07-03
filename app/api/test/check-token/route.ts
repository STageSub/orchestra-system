import { NextRequest, NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { getPrismaClient } from '@/lib/database-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 })
  }
  
  console.log('=== Token Check Debug ===')
  console.log('Checking token:', token)
  
  const results = {
    token,
    databases: {} as Record<string, any>
  }
  
  // Check Neon database
  try {
    console.log('Checking Neon database...')
    const neonToken = await neonPrisma.requestToken.findUnique({
      where: { token },
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
    
    if (neonToken) {
      results.databases.neon = {
        found: true,
        id: neonToken.id,
        requestId: neonToken.requestId,
        expiresAt: neonToken.expiresAt,
        usedAt: neonToken.usedAt,
        createdAt: neonToken.createdAt,
        request: {
          id: neonToken.request.id,
          musicianName: `${neonToken.request.musician.firstName} ${neonToken.request.musician.lastName}`,
          projectName: neonToken.request.projectNeed.project.name
        }
      }
    } else {
      results.databases.neon = { found: false }
    }
  } catch (error) {
    console.error('Error checking Neon:', error)
    results.databases.neon = { error: String(error) }
  }
  
  // Check orchestra databases
  const orchestras = ['sco', 'scosco']
  
  for (const subdomain of orchestras) {
    try {
      console.log(`\nChecking ${subdomain} database...`)
      const orchestraPrisma = await getPrismaClient(subdomain)
      
      // First, try to count tokens to verify connection
      const tokenCount = await orchestraPrisma.requestToken.count()
      console.log(`Total tokens in ${subdomain}: ${tokenCount}`)
      
      const orchestraToken = await orchestraPrisma.requestToken.findUnique({
        where: { token },
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
      
      if (orchestraToken) {
        results.databases[subdomain] = {
          found: true,
          totalTokens: tokenCount,
          id: orchestraToken.id,
          requestId: orchestraToken.requestId,
          expiresAt: orchestraToken.expiresAt,
          usedAt: orchestraToken.usedAt,
          createdAt: orchestraToken.createdAt,
          request: {
            id: orchestraToken.request.id,
            musicianName: `${orchestraToken.request.musician.firstName} ${orchestraToken.request.musician.lastName}`,
            projectName: orchestraToken.request.projectNeed.project.name
          }
        }
      } else {
        // List recent tokens for debugging
        const recentTokens = await orchestraPrisma.requestToken.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            token: true,
            createdAt: true,
            requestId: true
          }
        })
        
        results.databases[subdomain] = { 
          found: false,
          totalTokens: tokenCount,
          recentTokens: recentTokens.map(t => ({
            token: t.token.substring(0, 10) + '...',
            createdAt: t.createdAt,
            requestId: t.requestId
          }))
        }
      }
    } catch (error) {
      console.error(`Error checking ${subdomain}:`, error)
      results.databases[subdomain] = { error: String(error) }
    }
  }
  
  return NextResponse.json(results, { status: 200 })
}