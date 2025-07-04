import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await params
    const body = await request.json()
    const { name, hierarchyLevel } = body
    
    // Generate unique position ID
    const positionId = await generateUniqueId('position', prisma)
    
    // Create new position
    const position = await prisma.position.create({
      data: {
        positionId,
        name,
        hierarchyLevel,
        instrumentId: parseInt(id)
      }
    })
    
    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error('Error creating position:', error)
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    )
  }
}