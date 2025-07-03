import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const positions = await prisma.position.findMany({
      include: {
        instrument: true
      }
    })
    
    // Add qualified musician count for each position
    const positionsWithCounts = await Promise.all(
      positions.map(async (position) => {
        // Count only active musicians
        const activeMusicians = await prisma.musician.findMany({
          where: {
            isActive: true,
            isArchived: false,
            qualifications: {
              some: { positionId: position.id }
            }
          },
          select: { id: true }
        })
        
        return {
          ...position,
          qualifiedMusiciansCount: activeMusicians.length
        }
      })
    )
    
    // Sort positions by instrument displayOrder first, then by hierarchyLevel
    const sortedPositions = positionsWithCounts.sort((a, b) => {
      const orderA = a.instrument.displayOrder ?? 999
      const orderB = b.instrument.displayOrder ?? 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      return a.hierarchyLevel - b.hierarchyLevel
    })
    
    return NextResponse.json(sortedPositions)
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}