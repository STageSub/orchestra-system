import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { exec } from 'child_process'
import { promisify } from 'util'
import { PrismaClient } from '@prisma/client'

const execAsync = promisify(exec)

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
    const { orchestraId } = await request.json()
    
    if (orchestraId) {
      // Run migrations for a specific orchestra
      const orchestra = await centralDb.orchestra.findUnique({
        where: { id: orchestraId }
      })
      
      if (!orchestra) {
        return NextResponse.json({ error: 'Orchestra not found' }, { status: 404 })
      }
      
      if (!orchestra.databaseUrl) {
        return NextResponse.json({ error: 'Orchestra has no database configured' }, { status: 400 })
      }
      
      // Run migrations for this specific database
      const { stdout, stderr } = await execAsync(
        `DATABASE_URL="${orchestra.databaseUrl}" npx prisma migrate deploy --schema=./prisma/schema.orchestra.prisma`,
        { cwd: process.cwd() }
      )
      
      return NextResponse.json({
        success: true,
        orchestra: orchestra.name,
        output: stdout,
        error: stderr
      })
    } else {
      // Run migrations for all orchestras
      const orchestras = await centralDb.orchestra.findMany({
        where: {
          status: 'active',
          databaseUrl: { not: null }
        }
      })
      
      const results = []
      
      for (const orchestra of orchestras) {
        try {
          const { stdout, stderr } = await execAsync(
            `DATABASE_URL="${orchestra.databaseUrl}" npx prisma migrate deploy --schema=./prisma/schema.orchestra.prisma`,
            { cwd: process.cwd() }
          )
          
          results.push({
            orchestra: orchestra.name,
            success: true,
            output: stdout,
            error: stderr
          })
        } catch (error) {
          results.push({
            orchestra: orchestra.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      })
    }
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to run migrations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}