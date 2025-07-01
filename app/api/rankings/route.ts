import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { generateUniqueId } from '@/lib/id-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { positionId, listType, description } = body
    
    // Kontrollera om listan redan finns
    const existingList = await prismaMultitenant.rankingList.findUnique({
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
    const position = await prismaMultitenant.position.findUnique({
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
    const rankingList = await prismaMultitenant.rankingList.create({
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