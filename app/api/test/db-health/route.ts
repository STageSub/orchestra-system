import { NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { getPrismaClient } from '@/lib/database-config'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databases: {} as Record<string, any>
  }
  
  // Check Neon connection
  try {
    const orchestraCount = await neonPrisma.orchestra.count()
    const orchestras = await neonPrisma.orchestra.findMany({
      select: {
        subdomain: true,
        name: true,
        status: true,
        databaseUrl: true
      }
    })
    
    results.databases.neon = {
      connected: true,
      orchestraCount,
      orchestras: orchestras.map(o => ({
        subdomain: o.subdomain,
        name: o.name,
        status: o.status,
        hasDatabaseUrl: !!o.databaseUrl
      }))
    }
  } catch (error) {
    results.databases.neon = {
      connected: false,
      error: String(error)
    }
  }
  
  // Check SCOSCO connection
  try {
    const scoscoPrisma = await getPrismaClient('scosco')
    const tokenCount = await scoscoPrisma.requestToken.count()
    const musicianCount = await scoscoPrisma.musician.count()
    
    results.databases.scosco = {
      connected: true,
      tokenCount,
      musicianCount
    }
  } catch (error) {
    results.databases.scosco = {
      connected: false,
      error: String(error)
    }
  }
  
  // Check environment variables
  results.environment_vars = {
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    has_DATABASE_URL_SCOSO: !!process.env.DATABASE_URL_SCOSO,
    has_DATABASE_URL_SCO: !!process.env.DATABASE_URL_SCO,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
  
  return NextResponse.json(results, { status: 200 })
}