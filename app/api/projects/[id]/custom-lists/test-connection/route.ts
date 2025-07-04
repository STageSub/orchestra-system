import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { verifyToken } from '@/lib/auth-db'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  
  try {
    // Get auth info
    const cookieStore = await cookies()
    const token = cookieStore.get('orchestra-admin-session')?.value
    
    const authInfo = {
      hasToken: !!token,
      tokenPayload: null as any,
      orchestraId: null as string | null,
      subdomain: null as string | null
    }
    
    if (token) {
      const payload = await verifyToken(token)
      authInfo.tokenPayload = payload ? {
        userId: payload.userId,
        role: payload.role,
        orchestraId: payload.orchestraId,
        subdomain: payload.subdomain
      } : null
      authInfo.orchestraId = payload?.orchestraId || null
      authInfo.subdomain = payload?.subdomain || null
    }
    
    // Get prisma client
    const prisma = await getPrismaForUser(request)
    
    // Test database connection
    const connectionTest = {
      connected: false,
      databaseTime: null as string | null,
      error: null as string | null
    }
    
    try {
      const result = await prisma.$queryRaw`SELECT NOW() as current_time`
      connectionTest.connected = true
      connectionTest.databaseTime = (result as any)[0]?.current_time || 'Unknown'
    } catch (error) {
      connectionTest.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Check tables
    const tableChecks = {
      project: { exists: false, error: null as string | null },
      customRankingList: { exists: false, error: null as string | null },
      musician: { exists: false, error: null as string | null },
      position: { exists: false, error: null as string | null }
    }
    
    // Check Project table
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Project" LIMIT 1`
      tableChecks.project.exists = true
    } catch (error) {
      tableChecks.project.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Check CustomRankingList table
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      tableChecks.customRankingList.exists = true
    } catch (error) {
      tableChecks.customRankingList.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Check Musician table
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Musician" LIMIT 1`
      tableChecks.musician.exists = true
    } catch (error) {
      tableChecks.musician.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Check Position table
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Position" LIMIT 1`
      tableChecks.position.exists = true
    } catch (error) {
      tableChecks.position.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Try to fetch project
    let projectInfo = {
      found: false,
      id: null as number | null,
      name: null as string | null,
      error: null as string | null
    }
    
    try {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        select: { id: true, name: true }
      })
      
      if (project) {
        projectInfo.found = true
        projectInfo.id = project.id
        projectInfo.name = project.name
      }
    } catch (error) {
      projectInfo.error = error instanceof Error ? error.message : 'Unknown error'
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      auth: authInfo,
      database: connectionTest,
      tables: tableChecks,
      project: projectInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV !== 'production' ? errorStack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}