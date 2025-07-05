import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get orchestra details
    const orchestra = await neonPrisma.orchestra.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        subdomain: true,
        databaseUrl: true 
      }
    })

    if (!orchestra) {
      return NextResponse.json({ error: 'Orchestra not found' }, { status: 404 })
    }

    // Only allow reset for SCOSO demo account
    if (orchestra.subdomain !== 'scosco') {
      return NextResponse.json({ 
        error: 'Reset is only allowed for SCOSO demo orchestra' 
      }, { status: 403 })
    }

    if (!orchestra.databaseUrl) {
      return NextResponse.json({ 
        error: 'Orchestra has no database configured' 
      }, { status: 400 })
    }

    // Create a Prisma client for the orchestra's database
    const { PrismaClient } = require('@prisma/client')
    const orchestraPrisma = new PrismaClient({
      datasources: {
        db: {
          url: orchestra.databaseUrl
        }
      }
    })

    try {
      // Delete all data in the orchestra database
      await orchestraPrisma.$transaction(async (tx: any) => {
        // Delete in correct order to respect foreign key constraints
        await tx.communicationLog.deleteMany({})
        await tx.projectNeedFile.deleteMany({})
        await tx.projectFile.deleteMany({})
        await tx.request.deleteMany({})
        await tx.projectNeed.deleteMany({})
        await tx.project.deleteMany({})
        await tx.ranking.deleteMany({})
        await tx.rankingList.deleteMany({})
        await tx.position.deleteMany({})
        await tx.instrument.deleteMany({})
        await tx.musicianQualification.deleteMany({})
        await tx.musician.deleteMany({})
        await tx.emailTemplate.deleteMany({})
        await tx.groupEmailLog.deleteMany({})
        await tx.systemSettings.deleteMany({})
      })

      // Log the reset
      await logger.info('superadmin', 'Demo orchestra reset', {
        metadata: {
          orchestraId: orchestra.id,
          orchestraName: orchestra.name,
          resetBy: user.username
        }
      })

      // Create a system event
      await neonPrisma.systemEvent.create({
        data: {
          type: 'orchestra_reset',
          severity: 'info',
          title: 'Demo Orchestra Reset',
          description: `SCOSO demo orchestra was reset by ${user.username}`,
          orchestraId: orchestra.id
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Demo orchestra has been reset successfully'
      })

    } finally {
      await orchestraPrisma.$disconnect()
    }

  } catch (error) {
    console.error('Error resetting demo orchestra:', error)
    
    await logger.error('superadmin', 'Failed to reset demo orchestra', {
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json(
      { error: 'Failed to reset demo orchestra' },
      { status: 500 }
    )
  }
}