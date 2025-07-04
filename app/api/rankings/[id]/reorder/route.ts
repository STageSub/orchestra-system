import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await params
    const body = await request.json()
    const { rankings } = body
    
    console.log('Reordering rankings for list:', id, 'Rankings:', rankings)

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid rankings data' },
        { status: 400 }
      )
    }
    
    // Validera att alla rankings har giltiga id och rank värden
    for (const ranking of rankings) {
      if (!ranking.id || !ranking.rank || 
          typeof ranking.id !== 'number' || 
          typeof ranking.rank !== 'number' ||
          ranking.rank < 1) {
        return NextResponse.json(
          { error: `Invalid ranking data: id=${ranking.id}, rank=${ranking.rank}` },
          { status: 400 }
        )
      }
    }

    try {
      // Först, få alla rankings för att verifiera listId
      const existingRankings = await prisma.ranking.findMany({
        where: { 
          id: { in: rankings.map((r: { id: number }) => r.id) }
        },
        select: { id: true, listId: true }
      })
      
      if (existingRankings.length !== rankings.length) {
        return NextResponse.json(
          { error: 'Some rankings not found' },
          { status: 400 }
        )
      }
      
      // Verifiera att alla rankings tillhör samma lista
      const listIds = new Set(existingRankings.map(r => r.listId))
      if (listIds.size > 1) {
        return NextResponse.json(
          { error: 'Rankings belong to different lists' },
          { status: 400 }
        )
      }
      
      const listId = existingRankings[0].listId
      
      // Uppdatera alla rankningar i en transaktion med högre timeout för pooler connection
      // Vi måste först sätta alla till temporära värden för att undvika unique constraint konflikter
      const results = await prisma.$transaction(async (tx) => {
        // Steg 1: Sätt alla till temporära negativa rank värden
        await Promise.all(
          rankings.map((ranking: { id: number }, index: number) =>
            tx.ranking.update({
              where: { id: ranking.id },
              data: { rank: -(index + 1) }
            })
          )
        )
        
        // Steg 2: Uppdatera till de korrekta rank värdena
        const finalResults = await Promise.all(
          rankings.map((ranking: { id: number; rank: number }) =>
            tx.ranking.update({
              where: { id: ranking.id },
              data: { rank: ranking.rank }
            })
          )
        )
        
        return finalResults
      }, {
        maxWait: 5000, // Max väntetid för att få en connection (5 sekunder)
        timeout: 10000 // Max tid för transaktionen (10 sekunder)
      })
      
      console.log('Successfully updated', results.length, 'rankings')
      
      // Log the reorder operation
      await apiLogger.info(request, 'system', 'Ranking list reordered', {
        metadata: {
          rankingListId: listId,
          updatedCount: results.length,
          newOrder: rankings.map((r: { id: number; rank: number }) => ({ id: r.id, rank: r.rank }))
        }
      })
      
      return NextResponse.json({ success: true, updated: results.length })
    } catch (transactionError) {
      console.error('Transaction error:', transactionError)
      throw transactionError
    }
  } catch (error) {
    console.error('Error reordering rankings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder rankings'
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { raw: String(error) }
    
    // Log error
    await apiLogger.error(request, 'system', `Failed to reorder rankings: ${errorMessage}`, {
      metadata: {
        rankingListId: parseInt((await params).id),
        error: errorMessage
      }
    })
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}