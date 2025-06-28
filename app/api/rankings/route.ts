import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { positionId, listType, description } = body
    
    // Kontrollera om listan redan finns
    const existingList = await prisma.rankingList.findUnique({
      where: {
        positionId_listType: {
          positionId: parseInt(positionId),
          listType
        }
      }
    })
    
    if (existingList) {
      return NextResponse.json(
        { error: 'Rankningslista för denna position och listtyp finns redan' },
        { status: 400 }
      )
    }
    
    // Hämta position för att skapa namn
    const position = await prisma.position.findUnique({
      where: { id: parseInt(positionId) },
      include: { instrument: true }
    })
    
    if (!position) {
      return NextResponse.json(
        { error: 'Position hittades inte' },
        { status: 404 }
      )
    }
    
    // Generera unikt ID
    const rankingListId = await generateUniqueId('rankingList')
    
    // Skapa rankningslista
    const rankingList = await prisma.rankingList.create({
      data: {
        rankingListId,
        positionId: parseInt(positionId),
        listType,
        description
      }
    })
    
    return NextResponse.json(rankingList, { status: 201 })
  } catch (error) {
    console.error('Error creating ranking list:', error)
    return NextResponse.json(
      { error: 'Failed to create ranking list' },
      { status: 500 }
    )
  }
}