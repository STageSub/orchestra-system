import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Custom Lists API] POST request received')
  
  // Log request headers for debugging
  console.log('[Custom Lists API] Request headers:', {
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    subdomain: request.headers.get('x-subdomain'),
    origin: request.headers.get('origin'),
    host: request.headers.get('host')
  })
  
  try {
    const { id: projectId } = await params
    console.log('[Custom Lists API] Project ID:', projectId)
    
    // Try to parse request body with error handling
    let body
    try {
      // First try to get the raw text to see what we're receiving
      const text = await request.text()
      console.log('[Custom Lists API] Raw request body length:', text.length)
      console.log('[Custom Lists API] Raw request body:', text)
      
      if (!text || text.trim() === '') {
        throw new Error('Empty request body received')
      }
      
      body = JSON.parse(text)
      console.log('[Custom Lists API] Parsed body:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('[Custom Lists API] Failed to parse request body:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid request body - failed to parse JSON',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        },
        { status: 400 }
      )
    }
    
    const { positionId, musicians, saveAsTemplate, templateName } = body

    if (!positionId || !musicians || !Array.isArray(musicians)) {
      return NextResponse.json(
        { error: 'Position ID and musicians array are required' },
        { status: 400 }
      )
    }

    let prisma
    try {
      prisma = await getPrismaForUser(request)
      console.log('[Custom Lists API] Got Prisma client successfully')
    } catch (prismaError) {
      console.error('[Custom Lists API] Failed to get Prisma client:', prismaError)
      throw new Error(`Failed to establish database connection: ${prismaError instanceof Error ? prismaError.message : 'Unknown error'}`)
    }

    // Check if customRankingList table exists
    let hasCustomListTable = false
    let tableCheckError: any = null
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      hasCustomListTable = true
      console.log('[Custom Lists API] CustomRankingList table exists')
    } catch (error) {
      tableCheckError = error
      console.error('[Custom Lists API] Table check error:', {
        error: error instanceof Error ? error.message : error,
        code: (error as any)?.code,
        name: error instanceof Error ? error.name : 'Unknown'
      })
      
      // Check if it's actually a "table doesn't exist" error
      if (error instanceof Error && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        (error as any)?.code === '42P01' // PostgreSQL error code for undefined table
      )) {
        console.log('[Custom Lists API] Table does not exist (expected for new installations)')
      } else {
        // This is a different error, not just missing table
        console.error('[Custom Lists API] Unexpected error during table check:', error)
        throw new Error(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (!hasCustomListTable) {
      console.log('[Custom Lists API] Returning 503 - table not found')
      return NextResponse.json(
        { error: 'Custom ranking lists feature is not available yet. Please run database migration.' },
        { status: 503 },
        {
          headers: {
            'X-Debug-Table-Check': 'failed',
            'X-Debug-Message': 'CustomRankingList table not found'
          }
        }
      )
    }

    // Check if a custom list already exists for this position and project
    const existingList = await prisma.customRankingList.findFirst({
      where: {
        projectId: parseInt(projectId),
        positionId: parseInt(positionId)
      }
    })

    if (existingList) {
      return NextResponse.json(
        { 
          error: 'En anpassad lista finns redan för denna position i projektet',
          existingListId: existingList.id,
          existingListName: existingList.name
        },
        { status: 409 } // Conflict
      )
    }

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
    let customListId
    try {
      customListId = await generateUniqueId('customList', prisma)
      console.log('[Custom Lists API] Generated unique ID:', customListId)
    } catch (idError) {
      console.error('[Custom Lists API] Failed to generate unique ID:', idError)
      throw new Error(`Failed to generate unique ID: ${idError instanceof Error ? idError.message : 'Unknown error'}`)
    }
    
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
    // Detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    console.error('[Custom Lists API] Caught error:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack
    })
    
    // Try to log to database, but don't let it fail the response
    try {
      // Don't await logger to prevent it from blocking the response
      logger.error('api', 'Error creating custom ranking list', {
        metadata: {
          error: errorMessage,
          errorName,
          projectId: 'error-state'
        }
      })
    } catch (logError) {
      console.error('[Custom Lists API] Failed to log error:', logError)
    }
    
    // Return detailed error response with debugging info
    return NextResponse.json(
      { 
        error: 'Failed to create custom ranking list',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: {
          'X-Error-Type': errorName,
          'X-Error-Message': errorMessage.substring(0, 100) // First 100 chars for debugging
        }
      }
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

    // Check if customRankingList table exists
    let hasCustomListTable = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      hasCustomListTable = true
    } catch (error) {
      console.error('[Custom Lists API GET] Table check error:', {
        error: error instanceof Error ? error.message : error,
        code: (error as any)?.code
      })
      
      // Check if it's actually a "table doesn't exist" error
      if (error instanceof Error && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') ||
        (error as any)?.code === '42P01'
      )) {
        // Table doesn't exist yet
      } else {
        // This is a different error
        throw new Error(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (!hasCustomListTable) {
      return NextResponse.json(
        { error: 'Custom ranking lists feature is not available yet' },
        { status: 503 }
      )
    }

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
    // Detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    console.error('[Custom Lists API GET] Caught error:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack
    })
    
    // Try to log to database, but don't let it fail the response
    try {
      await logger.error('api', 'Error fetching custom list', {
        error: errorMessage,
        stack: errorStack,
        metadata: {
          errorName,
          projectId: params ? (await params).id : 'unknown',
          customListId
        }
      })
    } catch (logError) {
      console.error('[Custom Lists API GET] Failed to log error:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch custom list',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: {
          'X-Error-Type': errorName,
          'X-Error-Message': errorMessage.substring(0, 100)
        }
      }
    )
  }
}