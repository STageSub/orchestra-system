import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const instrumentId = searchParams.get('instrumentId')
    const positionId = searchParams.get('positionId')
    const status = searchParams.get('status')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { musicianId: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status === 'active') {
      where.isActive = true
      where.isArchived = false
    } else if (status === 'inactive') {
      where.isActive = false
      where.isArchived = false
    } else if (status === 'archived') {
      where.isArchived = true
    }
    
    const musicians = await prismaMultitenant.musician.findMany({
      where,
      include: {
        qualifications: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Filter by instrument and/or position if specified
    let filteredMusicians = musicians
    
    if (positionId) {
      // If position is specified, filter by exact position
      filteredMusicians = musicians.filter(musician =>
        musician.qualifications.some(q => 
          q.position.id === parseInt(positionId)
        )
      )
    } else if (instrumentId) {
      // If only instrument is specified, filter by instrument
      filteredMusicians = musicians.filter(musician =>
        musician.qualifications.some(q => 
          q.position.instrument.id === parseInt(instrumentId)
        )
      )
    }
    
    return NextResponse.json(filteredMusicians)
  } catch (error) {
    console.error('Error fetching musicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch musicians' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, preferredLanguage, localResidence, notes, qualificationIds } = body
    
    // Check for duplicate email
    const emailExists = await prismaMultitenant.musician.findFirst({
      where: { email }
    })
    
    if (emailExists) {
      return NextResponse.json(
        { error: `E-postadressen används redan av ${emailExists.firstName} ${emailExists.lastName} (${emailExists.musicianId})` },
        { status: 400 }
      )
    }
    
    // Check for duplicate phone if provided
    if (phone) {
      const phoneExists = await prismaMultitenant.musician.findFirst({
        where: { phone }
      })
      
      if (phoneExists) {
        return NextResponse.json(
          { error: `Telefonnumret används redan av ${phoneExists.firstName} ${phoneExists.lastName} (${phoneExists.musicianId})` },
          { status: 400 }
        )
      }
    }
    
    // Generate unique musician ID
    const musicianId = await generateUniqueId('musician')
    
    // Create musician with qualifications
    const musician = await prismaMultitenant.musician.create({
      data: {
        musicianId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        preferredLanguage: preferredLanguage || 'sv',
        localResidence: localResidence || false,
        notes: notes || null,
        qualifications: {
          create: qualificationIds.map((positionId: number) => ({
            positionId
          }))
        }
      },
      include: {
        qualifications: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json(musician, { status: 201 })
  } catch (error: any) {
    console.error('Error creating musician:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'En musiker med denna e-postadress finns redan' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create musician' },
      { status: 500 }
    )
  }
}