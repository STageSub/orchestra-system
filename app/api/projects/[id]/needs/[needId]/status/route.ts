import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, needId } = await context.params
    const body = await request.json()
    const { status } = body
    
    // Log status update start
    await apiLogger.info(request, 'api', 'Updating project need status', {
      metadata: {
        action: 'update_need_status',
        projectId: id,
        needId,
        newStatus: status
      }
    })

    if (!['active', 'paused', 'completed', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Ogiltig status' },
        { status: 400 }
      )
    }

    const updatedNeed = await prisma.projectNeed.update({
      where: { id: parseInt(needId) },
      data: { 
        status,
        ...(status === 'archived' && { archivedAt: new Date() })
      }
    })

    // Log successful update
    await apiLogger.info(request, 'api', 'Project need status updated successfully', {
      metadata: {
        action: 'update_need_status',
        projectId: id,
        needId,
        projectNeedId: updatedNeed.projectNeedId,
        oldStatus: updatedNeed.status,
        newStatus: status
      }
    })

    return NextResponse.json(updatedNeed)
  } catch (error) {
    console.error('Error updating need status:', error)
    
    const { id, needId } = await context.params
    // Log error
    await apiLogger.error(request, 'api', `Failed to update need status: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'update_need_status',
        projectId: id,
        needId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Kunde inte uppdatera status' },
      { status: 500 }
    )
  }
}