import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, needId } = await context.params
    
    // Log need fetch start
    await apiLogger.info(request, 'api', 'Fetching project need details', {
      metadata: {
        action: 'get_project_need',
        projectId: id,
        needId
      }
    })
    
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true,
        _count: {
          select: {
            requests: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!need) {
      await apiLogger.warn(request, 'api', 'Project need not found', {
        metadata: {
          action: 'get_project_need',
          projectId: id,
          needId
        }
      })
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    // Log successful fetch
    await apiLogger.info(request, 'api', 'Project need fetched successfully', {
      metadata: {
        action: 'get_project_need',
        projectId: id,
        needId,
        positionId: need.positionId,
        quantity: need.quantity
      }
    })

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error fetching project need:', error)
    
    const { id, needId } = await context.params
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch project need: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'get_project_need',
        projectId: id,
        needId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Kunde inte hämta behovsdata' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, needId } = await context.params
    
    // Log deletion start
    await apiLogger.info(request, 'api', 'Attempting to delete project need', {
      metadata: {
        action: 'delete_project_need',
        projectId: id,
        needId
      }
    })
    
    // Check if the need has any requests
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    if (!need) {
      await apiLogger.warn(request, 'api', 'Project need not found for deletion', {
        metadata: {
          action: 'delete_project_need',
          projectId: id,
          needId
        }
      })
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    // If there are requests, archive instead of delete
    if (need._count.requests > 0) {
      await prisma.projectNeed.update({
        where: { id: parseInt(needId) },
        data: {
          status: 'archived',
          archivedAt: new Date()
        }
      })
      
      // Log archival
      await apiLogger.info(request, 'api', 'Project need archived (has requests)', {
        metadata: {
          action: 'archive_project_need',
          projectId: id,
          needId,
          requestCount: need._count.requests
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        archived: true,
        message: 'Behovet arkiverades eftersom det har förfrågningar' 
      })
    }
    
    // If no requests, delete normally
    await prisma.projectNeed.delete({
      where: { id: parseInt(needId) }
    })
    
    // Log successful deletion
    await apiLogger.info(request, 'api', 'Project need deleted successfully', {
      metadata: {
        action: 'delete_project_need',
        projectId: id,
        needId
      }
    })
    
    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Error deleting project need:', error)
    
    const { id, needId } = await context.params
    // Log error
    await apiLogger.error(request, 'api', `Failed to delete project need: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'delete_project_need',
        projectId: id,
        needId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to delete project need' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, needId } = await context.params
    const body = await request.json()
    
    // Log update start
    await apiLogger.info(request, 'api', 'Updating project need', {
      metadata: {
        action: 'update_project_need',
        projectId: id,
        needId,
        updates: body
      }
    })
    
    // First check if need exists and get current state
    const currentNeed = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        _count: {
          select: {
            requests: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!currentNeed) {
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    // Check if quantity is being reduced below accepted count
    if (body.quantity < currentNeed._count.requests) {
      return NextResponse.json(
        { error: `Kan inte minska antalet till ${body.quantity} eftersom ${currentNeed._count.requests} musiker redan har tackat ja` },
        { status: 400 }
      )
    }

    // Check if requests have been sent (strategy and response time become locked)
    const hasRequests = await prisma.request.findFirst({
      where: { projectNeedId: parseInt(needId) }
    })

    const updateData: any = {
      quantity: body.quantity
    }

    // Only update strategy and response time if no requests have been sent
    if (!hasRequests) {
      if (body.requestStrategy) updateData.requestStrategy = body.requestStrategy
      if (body.responseTimeHours !== undefined) updateData.responseTimeHours = body.responseTimeHours
      if (body.maxRecipients !== undefined) updateData.maxRecipients = body.maxRecipients
    }

    const updatedNeed = await prisma.projectNeed.update({
      where: { id: parseInt(needId) },
      data: updateData,
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true
      }
    })

    // Log successful update
    await apiLogger.info(request, 'api', 'Project need updated successfully', {
      metadata: {
        action: 'update_project_need',
        projectId: id,
        needId,
        projectNeedId: updatedNeed.projectNeedId,
        quantity: updatedNeed.quantity,
        requestStrategy: updatedNeed.requestStrategy
      }
    })

    return NextResponse.json(updatedNeed)
  } catch (error) {
    console.error('Error updating project need:', error)
    
    const { id, needId } = await context.params
    // Log error
    await apiLogger.error(request, 'api', `Failed to update project need: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'update_project_need',
        projectId: id,
        needId,
        error: error instanceof Error ? error.message : String(error),
        requestData: body
      }
    })
    
    return NextResponse.json(
      { error: 'Kunde inte uppdatera behovet' },
      { status: 500 }
    )
  }
}