import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
    // Log project fetch start
    await apiLogger.info(request, 'api', 'Fetching project details', {
      metadata: {
        action: 'get_project',
        projectId: id
      }
    })
    
    // Check if customRankingList table exists (for backwards compatibility)
    let includeCustomList = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "CustomRankingList" LIMIT 1`
      includeCustomList = true
    } catch (error) {
      // Table doesn't exist yet, skip including it
    }
    
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        projectNeeds: {
          include: {
            position: {
              include: {
                instrument: true
              }
            },
            rankingList: true,
            ...(includeCustomList && { customRankingList: true }),
            requests: {
              select: {
                status: true
              }
            },
            _count: {
              select: {
                requests: true
              }
            }
          },
          orderBy: [
            { position: { instrumentId: 'asc' } },
            { position: { hierarchyLevel: 'asc' } }
          ]
        },
        _count: {
          select: {
            projectFiles: true,
            groupEmailLogs: true
          }
        }
      }
    })
    
    if (!project) {
      await apiLogger.warn(request, 'api', 'Project not found', {
        metadata: {
          action: 'get_project',
          projectId: id
        }
      })
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Add status information to each need
    const projectWithStatus = {
      ...project,
      projectNeeds: project.projectNeeds.map(need => {
        const requests = need.requests
        const acceptedCount = requests.filter(r => r.status === 'accepted').length
        const pendingCount = requests.filter(r => r.status === 'pending').length
        const declinedCount = requests.filter(r => r.status === 'declined').length
        const isFullyStaffed = acceptedCount >= need.quantity

        return {
          ...need,
          needStatus: need.status, // Map database 'status' to 'needStatus' for frontend
          status: {
            acceptedCount,
            pendingCount,
            declinedCount,
            totalRequests: requests.length,
            isFullyStaffed,
            remainingNeeded: Math.max(0, need.quantity - acceptedCount)
          },
          // Remove requests array to keep response clean
          requests: undefined
        }
      })
    }
    
    // Log successful fetch
    await apiLogger.info(request, 'api', 'Project fetched successfully', {
      metadata: {
        action: 'get_project',
        projectId: project.projectId,
        projectName: project.name,
        needsCount: project.projectNeeds.length,
        filesCount: project._count.projectFiles
      }
    })
    
    return NextResponse.json(projectWithStatus)
  } catch (error) {
    console.error('Error fetching project:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch project: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'get_project',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    const body = await request.json()
    const { name, startDate, weekNumber, rehearsalSchedule, concertInfo, notes } = body
    
    // Log project update start
    await apiLogger.info(request, 'api', 'Updating project', {
      metadata: {
        action: 'update_project',
        projectId: id,
        updates: { name, startDate, weekNumber }
      }
    })
    
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startDate: new Date(startDate),
        weekNumber: parseInt(weekNumber),
        rehearsalSchedule,
        concertInfo,
        notes
      }
    })
    
    // Log successful update
    await apiLogger.info(request, 'api', 'Project updated successfully', {
      metadata: {
        action: 'update_project',
        projectId: project.projectId,
        projectName: project.name,
        startDate: project.startDate,
        weekNumber: project.weekNumber
      }
    })
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'update_project',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
    // Log project deletion start
    await apiLogger.info(request, 'api', 'Attempting to delete project', {
      metadata: {
        action: 'delete_project',
        projectId: id
      }
    })
    
    // First check if the project has any requests
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        projectNeeds: {
          include: {
            _count: {
              select: {
                requests: true
              }
            }
          }
        }
      }
    })
    
    if (!project) {
      await apiLogger.warn(request, 'api', 'Project not found for deletion', {
        metadata: {
          action: 'delete_project',
          projectId: id
        }
      })
      return NextResponse.json(
        { error: 'Projekt hittades inte' },
        { status: 404 }
      )
    }
    
    // Check if any projectNeed has requests
    const hasRequests = project.projectNeeds.some(need => need._count.requests > 0)
    
    if (hasRequests) {
      await apiLogger.warn(request, 'api', 'Cannot delete project with requests', {
        metadata: {
          action: 'delete_project',
          projectId: project.projectId,
          projectName: project.name,
          hasRequests: true
        }
      })
      return NextResponse.json(
        { error: 'Kan inte ta bort projekt som har skickat förfrågningar' },
        { status: 400 }
      )
    }
    
    // Delete the project - cascade will handle related records
    const deletedProject = await prisma.project.delete({
      where: { id: parseInt(id) }
    })
    
    // Log successful deletion
    await apiLogger.info(request, 'api', 'Project deleted successfully', {
      metadata: {
        action: 'delete_project',
        projectId: deletedProject.projectId,
        projectName: deletedProject.name
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'delete_project',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid borttagning av projektet' },
      { status: 500 }
    )
  }
}