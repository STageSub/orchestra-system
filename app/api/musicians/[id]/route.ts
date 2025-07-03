import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const prisma = await getPrismaForUser(request)
    const musician = await prisma.musician.findUnique({
      where: { id: parseInt(id) },
      include: {
        qualifications: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        },
        rankings: {
          include: {
            rankingList: {
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
            { rankingList: { position: { instrument: { displayOrder: { sort: 'asc', nulls: 'last' } } } } },
            { rankingList: { position: { hierarchyLevel: 'asc' } } },
            { rankingList: { listType: 'asc' } }
          ]
        }
      }
    })

    if (!musician) {
      return NextResponse.json(
        { error: 'Musician not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(musician)
  } catch (error) {
    console.error('Error fetching musician:', error)
    return NextResponse.json(
      { error: 'Failed to fetch musician' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const prisma = await getPrismaForUser(request)
    const body = await request.json()
    const { firstName, lastName, email, phone, preferredLanguage, localResidence, notes, qualificationIds, isActive, isArchived } = body

    // Check for duplicate email (excluding current musician)
    const emailExists = await prisma.musician.findFirst({
      where: { 
        email,
        NOT: { id: parseInt(id) }
      }
    })
    
    if (emailExists) {
      return NextResponse.json(
        { error: `E-postadressen används redan av ${emailExists.firstName} ${emailExists.lastName} (${emailExists.musicianId})` },
        { status: 400 }
      )
    }
    
    // Check for duplicate phone if provided (excluding current musician)
    if (phone) {
      const phoneExists = await prisma.musician.findFirst({
        where: { 
          phone,
          NOT: { id: parseInt(id) }
        }
      })
      
      if (phoneExists) {
        return NextResponse.json(
          { error: `Telefonnumret används redan av ${phoneExists.firstName} ${phoneExists.lastName} (${phoneExists.musicianId})` },
          { status: 400 }
        )
      }
    }

    // Update musician and qualifications in transaction
    const musician = await prisma.$transaction(async (tx) => {
      // Update basic info
      const updatedMusician = await tx.musician.update({
        where: { id: parseInt(id) },
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          preferredLanguage: preferredLanguage || 'sv',
          localResidence: localResidence || false,
          notes: notes || null,
          isActive: isActive !== undefined ? isActive : true,
          isArchived: isArchived !== undefined ? isArchived : undefined
        }
      })

      // Update qualifications if provided
      if (qualificationIds) {
        // Remove existing qualifications
        await tx.musicianQualification.deleteMany({
          where: { musicianId: parseInt(id) }
        })

        // Add new qualifications
        await tx.musicianQualification.createMany({
          data: qualificationIds.map((positionId: number) => ({
            musicianId: parseInt(id),
            positionId
          }))
        })
      }

      return updatedMusician
    })

    // Fetch complete musician data
    const updatedMusicianWithRelations = await prisma.musician.findUnique({
      where: { id: musician.id },
      include: {
        qualifications: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        },
        rankings: {
          include: {
            rankingList: {
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
            { rankingList: { position: { instrument: { displayOrder: { sort: 'asc', nulls: 'last' } } } } },
            { rankingList: { position: { hierarchyLevel: 'asc' } } },
            { rankingList: { listType: 'asc' } }
          ]
        }
      }
    })

    return NextResponse.json(updatedMusicianWithRelations)
  } catch (error: any) {
    console.error('Error updating musician:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'En musiker med denna e-postadress finns redan' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update musician' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const prisma = await getPrismaForUser(request)
    // Soft delete - archive the musician
    await prisma.musician.update({
      where: { id: parseInt(id) },
      data: {
        isArchived: true,
        isActive: false,
        archivedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Musician archived successfully' })
  } catch (error) {
    console.error('Error archiving musician:', error)
    return NextResponse.json(
      { error: 'Failed to archive musician' },
      { status: 500 }
    )
  }
}