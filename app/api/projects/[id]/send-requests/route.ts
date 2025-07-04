import { NextRequest, NextResponse } from 'next/server'
import { getRecipientsForNeed, getRecipientsForProject } from '@/lib/recipient-selection'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'
import { updateSendProgress } from '../send-progress/route'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Parse request body to get optional projectNeedId and sessionId
  const body = await request.json().catch(() => ({}))
  const { projectNeedId, sessionId } = body

  try {
    const prisma = await getPrismaForUser(request)
    let totalSent = 0
    const results = []
    
    // Log request sending start
    await apiLogger.info(request, 'api', 'Starting to send project requests', {
      metadata: {
        action: 'send_requests',
        projectId: id,
        projectNeedId: projectNeedId || null,
        type: projectNeedId ? 'single_need' : 'all_needs'
      }
    })

    if (projectNeedId) {
      // Send for specific need
      const result = await getRecipientsForNeed(projectNeedId, {
        dryRun: false,
        includeDetails: false
      }, prisma)

      totalSent = result.totalToSend
      if (result.needs.length > 0) {
        const need = result.needs[0]
        results.push({
          needId: need.needId,
          position: need.position,
          sent: need.musiciansToContact.length
        })
      }
    } else {
      // Send for all needs in project
      const result = await getRecipientsForProject(parseInt(id), {
        dryRun: false,
        includeDetails: false,
        sessionId,
        onProgress: (projectId, data) => {
          updateSendProgress(id, sessionId, data)
        }
      }, prisma)

      totalSent = result.totalToSend
      result.needs.forEach(need => {
        results.push({
          needId: need.needId,
          position: need.position,
          sent: need.musiciansToContact.length
        })
      })
    }

    // Update progress to completed
    if (!projectNeedId && sessionId) {
      updateSendProgress(id, sessionId, {
        status: 'completed',
        sent: totalSent
      })
    }
    
    // Log successful sending
    await apiLogger.info(request, 'api', 'Project requests sent successfully', {
      metadata: {
        action: 'send_requests',
        projectId: id,
        projectNeedId: projectNeedId || null,
        totalSent,
        results,
        type: projectNeedId ? 'single_need' : 'all_needs'
      }
    })
    
    return NextResponse.json({
      success: true,
      totalSent,
      results,
      message: totalSent > 0 
        ? `${totalSent} förfrågningar skickades ut` 
        : 'Inga förfrågningar behövde skickas'
    })
  } catch (error) {
    console.error('Error sending requests:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to send requests: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'send_requests',
        projectId: id,
        projectNeedId: projectNeedId || null,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid utskick av förfrågningar' },
      { status: 500 }
    )
  }
}