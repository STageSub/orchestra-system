import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    const instruments = await prisma.instrument.findMany({
      where: includeArchived ? {} : { isArchived: false },
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
              _count: {
                qualifications: activeMusicians.length
              }
            }
          })
        )
        
        // Get total unique active musicians for the instrument
        const activeMusiciansForInstrument = await prisma.musician.findMany({
          where: {
            isActive: true,
            isArchived: false,
            qualifications: {
              some: {
                position: {
                  instrumentId: instrument.id
                }
              }
            }
          },
          select: { id: true }
        })
        
        return {
          ...instrument,
          positions: positionsWithCounts,
          totalUniqueMusicians: activeMusiciansForInstrument.length
        }
      })
    )
    
    return NextResponse.json(instrumentsWithCounts)
  } catch (error: any) {
    console.error('Error fetching instruments:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch instruments',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const body = await request.json()
    const { name, displayOrder, positions } = body
    
    // Generera unikt ID
    const instrumentId = await generateUniqueId('instrument', prisma)
    
    // Skapa instrument med positioner
    const instrument = await prisma.instrument.create({
      data: {
        instrumentId,
        name,
        displayOrder: displayOrder || null,
        positions: {
          create: await Promise.all(
            positions?.map(async (pos: any, index: number) => ({
              positionId: await generateUniqueId('position', prisma),
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