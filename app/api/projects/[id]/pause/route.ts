import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const prisma = await getPrismaForUser(request)
    const { pause } = await request.json()
    
    // Log pause/resume start
    await apiLogger.info(request, 'api', `${pause ? 'Pausing' : 'Resuming'} project`, {
      metadata: {
        action: pause ? 'pause_project' : 'resume_project',
        projectId: id
      }
    })

    // Get all needs for this project
    const projectNeeds = await prisma.projectNeed.findMany({
      where: { projectId: parseInt(id) }
    })

    if (projectNeeds.length === 0) {
      return NextResponse.json(
        { error: 'Inga behov att pausa/återuppta' },
        { status: 400 }
      )
    }

    // Update all needs
    await prisma.projectNeed.updateMany({
      where: { projectId: parseInt(id) },
      data: { status: pause ? 'paused' : 'active' }
    })

    const action = pause ? 'pausat' : 'återupptagit'
    const needsCount = projectNeeds.length

    // Log successful operation
    await apiLogger.info(request, 'api', `Project ${pause ? 'paused' : 'resumed'} successfully`, {
      metadata: {
        action: pause ? 'pause_project' : 'resume_project',
        projectId: id,
        affectedNeeds: needsCount
      }
    })

    return NextResponse.json({
      success: true,
      message: `Projektet har ${action}. ${needsCount} behov ${pause ? 'pausades' : 'återupptogs'}.`,
      paused: pause,
      affectedNeeds: needsCount
    })
  } catch (error) {
    console.error('Error pausing/resuming project:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to pause/resume project: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'pause_resume_project',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid pausning/återupptagning av projektet' },
      { status: 500 }
    )
  }
}