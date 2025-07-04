import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { getRecipientsForProject } from '@/lib/recipient-selection'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const prisma = await getPrismaForUser(request)
    
    // Log preview generation start
    await apiLogger.info(request, 'api', 'Generating project requests preview', {
      metadata: {
        action: 'preview_all_requests',
        projectId
      }
    })
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
    }, prisma)

    // Log successful preview generation
    await apiLogger.info(request, 'api', 'Project requests preview generated successfully', {
      metadata: {
        action: 'preview_all_requests',
        projectId,
        projectName: project.name,
        totalNeeds: project.projectNeeds.length,
        totalToSend: result.totalToSend,
        canSend: result.canSend
      }
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
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'preview_all_requests',
        projectId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Kunde inte generera förhandsgranskning' },
      { status: 500 }
    )
  }
}