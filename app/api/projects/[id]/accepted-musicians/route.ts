import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Hämta alla accepterade förfrågningar för projektet
    const acceptedRequests = await prisma.request.findMany({
      where: {
        projectNeed: {
          projectId: projectId
        },
        status: 'accepted'
      },
      include: {
        musician: true,
        projectNeed: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          projectNeed: {
            position: {
              instrument: {
                displayOrder: 'asc'
              }
            }
          }
        },
        {
          projectNeed: {
            position: {
              hierarchyLevel: 'asc'
            }
          }
        },
        {
          musician: {
            lastName: 'asc'
          }
        }
      ]
    })

    // Formatera data för frontend
    const formattedData = acceptedRequests.map(request => ({
      musician: {
        id: request.musician.id,
        musicianId: request.musician.musicianId,
        firstName: request.musician.firstName,
        lastName: request.musician.lastName,
        email: request.musician.email,
        phone: request.musician.phone
      },
      position: {
        id: request.projectNeed.position.id,
        name: request.projectNeed.position.name,
        instrument: {
          id: request.projectNeed.position.instrument.id,
          name: request.projectNeed.position.instrument.name
        }
      }
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error fetching accepted musicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accepted musicians' },
      { status: 500 }
    )
  }
}