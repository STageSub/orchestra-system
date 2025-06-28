import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET() {
  try {
    const instruments = await prisma.instrument.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        positions: {
          orderBy: { hierarchyLevel: 'asc' }
        },
        _count: {
          select: { positions: true }
        }
      }
    })
    
    // Get unique musician counts for each position
    const instrumentsWithCounts = await Promise.all(
      instruments.map(async (instrument) => {
        const positionsWithCounts = await Promise.all(
          instrument.positions.map(async (position) => {
            const uniqueMusicians = await prisma.musicianQualification.groupBy({
              by: ['musicianId'],
              where: { positionId: position.id }
            })
            
            return {
              ...position,
              _count: {
                qualifications: uniqueMusicians.length
              }
            }
          })
        )
        
        // Get total unique musicians for the instrument
        const allQualifications = await prisma.musicianQualification.findMany({
          where: {
            position: {
              instrumentId: instrument.id
            }
          },
          distinct: ['musicianId']
        })
        
        return {
          ...instrument,
          positions: positionsWithCounts,
          totalUniqueMusicians: allQualifications.length
        }
      })
    )
    
    return NextResponse.json(instrumentsWithCounts)
  } catch (error) {
    console.error('Error fetching instruments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instruments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, displayOrder, positions } = body
    
    // Generera unikt ID
    const instrumentId = await generateUniqueId('instrument')
    
    // Skapa instrument med positioner
    const instrument = await prisma.instrument.create({
      data: {
        instrumentId,
        name,
        displayOrder: displayOrder || null,
        positions: {
          create: await Promise.all(
            positions?.map(async (pos: any, index: number) => ({
              positionId: await generateUniqueId('position'),
              name: pos.name,
              hierarchyLevel: pos.hierarchyLevel || index + 1
            })) || []
          )
        }
      },
      include: {
        positions: true
      }
    })
    
    return NextResponse.json(instrument, { status: 201 })
  } catch (error) {
    console.error('Error creating instrument:', error)
    return NextResponse.json(
      { error: 'Failed to create instrument' },
      { status: 500 }
    )
  }
}