import { NextResponse } from 'next/server'
import { getRecipientsForNeed } from '@/lib/recipient-selection'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; needId: string }> }
) {
  const { id: projectId, needId } = await params

  try {
    // Use unified function with preview mode
    const result = await getRecipientsForNeed(parseInt(needId), {
      dryRun: true,
      includeDetails: true
    })

    const need = result.needs[0]

    // Strategy explanation
    const strategyExplanation = {
      sequential: 'En musiker kontaktas åt gången. När musiker svarar nej skickas automatiskt till nästa.',
      parallel: `${need.currentStatus.remaining} musiker kontaktas för att fylla alla positioner. Vid avböjande fylls på automatiskt.`,
      first_come: `Upp till ${need.maxRecipients || need.currentStatus.remaining} musiker kontaktas samtidigt. Först till kvarn gäller.`
    }

    return NextResponse.json({
      need: {
        position: need.position,
        quantity: need.quantity,
        currentStatus: need.currentStatus
      },
      strategy: {
        type: need.strategy,
        explanation: strategyExplanation[need.strategy] || ''
      },
      preview: {
        musiciansToContact: need.musiciansToContact,
        nextInQueue: need.nextInQueue,
        allMusiciansWithStatus: need.allMusiciansWithStatus || [], // NY: Alla musiker med status
        totalAvailable: need.totalAvailable,
        listType: need.listType, // Lägg till lista-typ
        rankingListId: need.rankingListId // Lägg till ranking list ID
      },
      canSend: need.canSend
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera förhandsgranskning' },
      { status: 500 }
    )
  }
}