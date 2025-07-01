import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET() {
  try {
    const instruments = await prismaMultitenant.instrument.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        positions: {
          orderBy: { hierarchyLevel: 'asc' },
          include: {
            rankingLists: {
              include: {
                _count: {
                  select: { rankings: true }
                }
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json(instruments)
  } catch (error) {
    console.error('Error fetching rankings overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings overview' },
      { status: 500 }
    )
  }
}