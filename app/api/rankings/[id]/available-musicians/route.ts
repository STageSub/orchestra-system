import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Hämta rankningslistan för att få position
    const rankingList = await prismaMultitenant.rankingList.findUnique({
      where: { id: parseInt(id) },
      include: {
        rankings: {
          select: { musicianId: true }
        }
      }
    })

    if (!rankingList) {
      return NextResponse.json(
        { error: 'Rankningslista hittades inte' },
        { status: 404 }
      )
    }

    // Hämta alla musiker som har kvalifikation för denna position
    // men som inte redan finns i listan
    const existingMusicianIds = rankingList.rankings.map(r => r.musicianId)

    const availableMusicians = await prismaMultitenant.musician.findMany({
      where: {
        qualifications: {
          some: {
            positionId: rankingList.positionId
          }
        },
        id: {
          notIn: existingMusicianIds
        }
      },
      orderBy: [
        { isActive: 'desc' },  // Aktiva först
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return NextResponse.json(availableMusicians)
  } catch (error) {
    console.error('Error fetching available musicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available musicians' },
      { status: 500 }
    )
  }
}