import { NextRequest, NextResponse } from 'next/server'
import { getRecipientsForNeed, getRecipientsForProject } from '@/lib/recipient-selection'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Parse request body to get optional projectNeedId
  const body = await request.json().catch(() => ({}))
  const { projectNeedId } = body

  try {
    let totalSent = 0
    const results = []

    if (projectNeedId) {
      // Send for specific need
      const result = await getRecipientsForNeed(projectNeedId, {
        dryRun: false,
        includeDetails: false
      })

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
        includeDetails: false
      })

      totalSent = result.totalToSend
      result.needs.forEach(need => {
        results.push({
          needId: need.needId,
          position: need.position,
          sent: need.musiciansToContact.length
        })
      })
    }

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
    return NextResponse.json(
      { error: 'Ett fel uppstod vid utskick av förfrågningar' },
      { status: 500 }
    )
  }
}