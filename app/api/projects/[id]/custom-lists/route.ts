import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { positionId, musicians, saveAsTemplate, templateName } = body

    if (!positionId || !musicians || !Array.isArray(musicians)) {
      return NextResponse.json(
        { error: 'Position ID and musicians array are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrismaForUser(request)

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create the custom ranking list
    const customListId = await generateUniqueId('customList', prisma)
    const customList = await prisma.customRankingList.create({
      data: {
        customListId,
        projectId: parseInt(projectId),
        positionId: parseInt(positionId),
        name: `V. ${project.weekNumber}`,
        isTemplate: saveAsTemplate || false,
        templateName: saveAsTemplate ? templateName : null,
        customRankings: {
          create: musicians.map((musicianId: number, index: number) => ({
            musicianId,
            rank: index + 1
          }))
        }
      },
      include: {
        customRankings: {
          include: {
            musician: true
          }
        }
      }
    })

    logger.info('api', 'Created custom ranking list', {
      projectId,
      positionId,
      customListId: customList.id,
      metadata: {
        musicianCount: musicians.length,
        isTemplate: saveAsTemplate || false,
        templateName
      }
    })

    return NextResponse.json({
      id: customList.id,
      customListId: customList.customListId,
      name: customList.name,
      musicianCount: customList.customRankings.length
    })
  } catch (error) {
    logger.error('api', 'Error creating custom ranking list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create custom ranking list' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch a specific custom list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const customListId = searchParams.get('customListId')

    if (!customListId) {
      return NextResponse.json(
        { error: 'Custom list ID is required' },
        { status: 400 }
      )
    }

    const prisma = await getPrismaForUser(request)

    const customList = await prisma.customRankingList.findUnique({
      where: { id: parseInt(customListId) },
      include: {
        project: true,
        position: {
          include: {
            instrument: true
          }
        },
        customRankings: {
          include: {
            musician: true
          },
          orderBy: {
            rank: 'asc'
          }
        }
      }
    })

    if (!customList) {
      return NextResponse.json(
        { error: 'Custom list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customList)
  } catch (error) {
    logger.error('api', 'Error fetching custom list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch custom list' },
      { status: 500 }
    )
  }
}