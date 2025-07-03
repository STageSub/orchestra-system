import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const instruments = await prisma.instrument.findMany({
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