import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { apiLogger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    
    // Log project fetch start
    await apiLogger.info(request, 'api', 'Fetching all projects', {
      metadata: {
        action: 'list_projects'
      }
    })
    
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            projectNeeds: true,
            projectFiles: true
          }
        },
        projectNeeds: {
          include: {
            requests: {
              select: {
                status: true
              }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })
    
    // Calculate staffing percentage for each project
    const projectsWithStaffing = projects.map(project => {
      let totalNeeded = 0
      let totalAccepted = 0
      let totalRequests = 0
      
      let allNeedsPaused = false
      
      project.projectNeeds.forEach(need => {
        totalNeeded += need.quantity
        const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
        totalAccepted += acceptedCount
        totalRequests += need.requests.length
      })
      
      // Check if all needs are paused
      if (project.projectNeeds.length > 0) {
        allNeedsPaused = project.projectNeeds.every(need => need.status === 'paused')
      }
      
      const staffingPercentage = totalNeeded > 0 
        ? Math.round((totalAccepted / totalNeeded) * 100)
        : 0
      
      // Remove the detailed needs data from response
      const { projectNeeds, ...projectData } = project
      
      return {
        ...projectData,
        staffingPercentage,
        totalNeeded,
        totalAccepted,
        totalRequests,
        allNeedsPaused
      }
    })
    
    // Log successful fetch
    await apiLogger.info(request, 'api', 'Projects fetched successfully', {
      metadata: {
        action: 'list_projects',
        projectCount: projectsWithStaffing.length,
        projectIds: projectsWithStaffing.map(p => p.projectId)
      }
    })
    
    return NextResponse.json(projectsWithStaffing)
  } catch (error) {
    console.error('Error fetching projects:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'list_projects',
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const body = await request.json()
    const { name, startDate, weekNumber, rehearsalSchedule, concertInfo, notes } = body
    
    // Log project creation start
    await apiLogger.info(request, 'api', 'Creating new project', {
      metadata: {
        action: 'create_project',
        projectName: name,
        startDate,
        weekNumber
      }
    })
    
    // Generate unique project ID
    const projectId = await generateUniqueId('project', prisma)
    
    const project = await prisma.project.create({
      data: {
        projectId,
        name,
        startDate: new Date(startDate),
        weekNumber: parseInt(weekNumber),
        rehearsalSchedule,
        concertInfo,
        notes
      }
    })
    
    // Log successful creation
    await apiLogger.info(request, 'api', 'Project created successfully', {
      metadata: {
        action: 'create_project',
        projectId: project.projectId,
        projectName: project.name,
        startDate: project.startDate,
        weekNumber: project.weekNumber
      }
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'create_project',
        error: error instanceof Error ? error.message : String(error),
        requestData: { name, startDate, weekNumber }
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}