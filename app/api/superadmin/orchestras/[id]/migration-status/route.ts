import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
// import { getPrisma } from '@/lib/prisma' - Not needed, using getPrismaForUser
import { PrismaClient } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await params
    
    // Get orchestra
    const orchestra = await prisma.orchestra.findUnique({
      where: { id }
    })
    
    if (!orchestra) {
      return NextResponse.json(
        { error: 'Orkester hittades inte' },
        { status: 404 }
      )
    }
    
    if (!orchestra.databaseUrl) {
      return NextResponse.json({
        status: 'no_database',
        message: 'Ingen databas provisionerad'
      })
    }
    
    // Try to connect to the orchestra's database
    const targetPrisma = new PrismaClient({
      datasources: {
        db: {
          url: orchestra.databaseUrl
        }
      }
    })
    
    try {
      // Check if tables exist by querying a basic table
      const count = await targetPrisma.instrument.count()
      await targetPrisma.$disconnect()
      
      // Tables exist, update status if needed
      if (orchestra.status !== 'active') {
        await prisma.orchestra.update({
          where: { id },
          data: { status: 'active' }
        })
      }
      
      return NextResponse.json({
        status: 'ready',
        message: 'Databas är klar att använda',
        tableCount: count
      })
    } catch (error) {
      await targetPrisma.$disconnect()
      
      return NextResponse.json({
        status: 'pending_migration',
        message: 'Migrationer har inte körts än',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return NextResponse.json(
      { error: 'Kunde inte kontrollera migreringsstatus' },
      { status: 500 }
    )
  }
}

// Update orchestra status after successful migration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrismaForUser(request)
  try {
    const { id } = await params
    
    // Update orchestra to active
    const orchestra = await prisma.orchestra.update({
      where: { id },
      data: { status: 'active' }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Orkesterstatus uppdaterad',
      orchestra: {
        id: orchestra.id,
        name: orchestra.name,
        status: orchestra.status
      }
    })
  } catch (error) {
    console.error('Failed to update orchestra status:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera orkesterstatus' },
      { status: 500 }
    )
  }
}