import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
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
    
    return NextResponse.json(projectWithStatus)
  } catch (error) {
    console.error('Error fetching project:', error)
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
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
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
      return NextResponse.json(
        { error: 'Projekt hittades inte' },
        { status: 404 }
      )
    }
    
    // Check if any projectNeed has requests
    const hasRequests = project.projectNeeds.some(need => need._count.requests > 0)
    
    if (hasRequests) {
      return NextResponse.json(
        { error: 'Kan inte ta bort projekt som har skickat förfrågningar' },
        { status: 400 }
      )
    }
    
    // Delete the project - cascade will handle related records
    await prisma.project.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid borttagning av projektet' },
      { status: 500 }
    )
  }
}