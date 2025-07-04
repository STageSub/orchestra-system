import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger, getSystemLogs } from '@/lib/logger'
import { prisma as centralPrisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    user: null,
    orchestra: null,
    database: null,
    writeTest: null,
    readTest: null,
    apiReadTest: null,
    errors: []
  }

  try {
    // 1. Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        debugInfo 
      }, { status: 401 })
    }

    debugInfo.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      orchestraId: user.orchestraId
    }

    // 2. Get orchestra info
    if (user.orchestraId) {
      try {
        const orchestra = await centralPrisma.orchestra.findUnique({
          where: { id: user.orchestraId },
          select: {
            id: true,
            name: true,
            subdomain: true,
            databaseUrl: true
          }
        })
        debugInfo.orchestra = {
          id: orchestra?.id,
          name: orchestra?.name,
          subdomain: orchestra?.subdomain,
          hasDatabaseUrl: !!orchestra?.databaseUrl
        }
      } catch (error) {
        debugInfo.errors.push({
          step: 'getOrchestra',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // 3. Get the prisma client for this user
    let prisma
    try {
      prisma = await getPrismaForUser(request)
      debugInfo.database = {
        connected: true,
        client: 'orchestra-specific'
      }
    } catch (error) {
      debugInfo.errors.push({
        step: 'getPrismaForUser',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.json({ debugInfo }, { status: 500 })
    }

    // 4. Test writing a log entry directly
    try {
      const testLog = await prisma.systemLog.create({
        data: {
          id: `test-${Date.now()}`,
          level: 'info',
          category: 'test',
          message: `Debug test log at ${new Date().toISOString()}`,
          metadata: { debug: true, userId: user.id },
          userId: user.id,
          orchestraId: user.orchestraId
        }
      })
      debugInfo.writeTest = {
        success: true,
        logId: testLog.id,
        message: 'Successfully wrote test log directly'
      }
    } catch (error) {
      debugInfo.writeTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      debugInfo.errors.push({
        step: 'writeTest',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 5. Test reading logs directly
    try {
      const logs = await prisma.systemLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' }
      })
      debugInfo.readTest = {
        success: true,
        count: logs.length,
        latestLog: logs[0] ? {
          id: logs[0].id,
          timestamp: logs[0].timestamp,
          message: logs[0].message,
          category: logs[0].category
        } : null
      }
    } catch (error) {
      debugInfo.readTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      debugInfo.errors.push({
        step: 'readTest',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 6. Test using the API logger
    try {
      await apiLogger.info(request, 'test', 'Debug test using apiLogger', {
        userId: user.id,
        orchestraId: user.orchestraId,
        metadata: { debugTest: true }
      })
      debugInfo.apiLoggerTest = {
        success: true,
        message: 'API logger called successfully'
      }
    } catch (error) {
      debugInfo.apiLoggerTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 7. Test reading logs using getSystemLogs
    try {
      const systemLogs = await getSystemLogs({
        limit: 10,
        request: request
      })
      debugInfo.apiReadTest = {
        success: true,
        total: systemLogs.total,
        count: systemLogs.logs.length,
        logs: systemLogs.logs.slice(0, 3).map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          message: log.message,
          category: log.category
        }))
      }
    } catch (error) {
      debugInfo.apiReadTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      debugInfo.errors.push({
        step: 'apiReadTest',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 8. Check table structure
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'SystemLog'
        ORDER BY ordinal_position
      `
      debugInfo.tableStructure = {
        exists: true,
        columns: tableInfo
      }
    } catch (error) {
      debugInfo.tableStructure = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      message: 'Debug information collected',
      debugInfo
    })

  } catch (error) {
    debugInfo.errors.push({
      step: 'general',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ debugInfo }, { status: 500 })
  }
}