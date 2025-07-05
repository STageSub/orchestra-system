import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'

// Initialize central database client
const centralDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

export async function POST(request: NextRequest) {
  const auth = await checkSuperadminAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active orchestras
    const orchestras = await centralDb.orchestra.findMany({
      where: { status: 'active' }
    })
    
    // Clear Next.js cache for all orchestra paths
    const paths = [
      '/superadmin',
      '/admin',
      '/'
    ]
    
    // Add orchestra-specific paths
    orchestras.forEach(orchestra => {
      paths.push(`/${orchestra.subdomain}`)
      paths.push(`/${orchestra.subdomain}/admin`)
    })
    
    // Revalidate all paths
    paths.forEach(path => {
      try {
        revalidatePath(path)
      } catch (error) {
        console.log(`Failed to revalidate ${path}:`, error)
      }
    })
    
    // Clear any in-memory caches (in a real implementation, this might clear Redis or similar)
    if (global.orchestraCache) {
      global.orchestraCache = {}
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      clearedPaths: paths.length,
      orchestras: orchestras.length
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}