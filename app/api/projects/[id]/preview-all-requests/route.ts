import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRecipientsForProject } from '@/lib/recipient-selection'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      select: {
        name: true,
        projectNeeds: {
          select: { id: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Projekt hittades inte' }, { status: 404 })
    }

    // Use unified function with preview mode
    const result = await getRecipientsForProject(parseInt(projectId), {
      dryRun: true,
      includeDetails: true // Detta säkerställer att vi får allMusiciansWithStatus
    })

    return NextResponse.json({
      project: {
        name: project.name,
        totalNeeds: project.projectNeeds.length
      },
      needsPreviews: result.needs,
      totalToSend: result.totalToSend,
      canSend: result.canSend
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera förhandsgranskning' },
      { status: 500 }
    )
  }
}