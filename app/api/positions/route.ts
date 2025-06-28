import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      include: {
        instrument: true
      }
    })
    
    // Sort positions by instrument displayOrder first, then by hierarchyLevel
    const sortedPositions = positions.sort((a, b) => {
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