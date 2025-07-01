import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET() {
  try {
    const projects = await prismaMultitenant.project.findMany({
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
    
    return NextResponse.json(projectsWithStaffing)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, startDate, weekNumber, rehearsalSchedule, concertInfo, notes } = body
    
    // Generate unique project ID
    const projectId = await generateUniqueId('project')
    
    const project = await prismaMultitenant.project.create({
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
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}