import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Fetch all requests for this musician
    const requests = await prisma.request.findMany({
      where: { musicianId: parseInt(id) },
      include: {
        projectNeed: {
          include: {
            project: true,
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      },
      orderBy: [
        { projectNeed: { project: { startDate: 'desc' } } }
      ]
    })

    // Group by project and format response
    const projectHistory = requests.reduce((acc, request) => {
      const projectId = request.projectNeed.project.id
      
      if (!acc[projectId]) {
        acc[projectId] = {
          project: request.projectNeed.project,
          requests: []
        }
      }
      
      acc[projectId].requests.push({
        id: request.id,
        requestId: request.requestId,
        position: request.projectNeed.position,
        status: request.status,
        sentAt: request.sentAt,
        respondedAt: request.respondedAt,
        response: request.response
      })
      
      return acc
    }, {} as Record<number, any>)

    // Convert to array and sort by date
    const sortedHistory = Object.values(projectHistory).sort((a: any, b: any) => 
      new Date(b.project.startDate).getTime() - new Date(a.project.startDate).getTime()
    )

    return NextResponse.json(sortedHistory)
  } catch (error) {
    console.error('Error fetching project history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project history' },
      { status: 500 }
    )
  }
}