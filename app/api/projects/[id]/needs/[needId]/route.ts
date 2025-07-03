import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { needId } = await context.params
    
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true,
        _count: {
          select: {
            requests: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!need) {
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json(need)
  } catch (error) {
    console.error('Error fetching project need:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta behovsdata' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { needId } = await context.params
    
    // Check if the need has any requests
    const need = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    if (!need) {
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    // If there are requests, archive instead of delete
    if (need._count.requests > 0) {
      await prisma.projectNeed.update({
        where: { id: parseInt(needId) },
        data: {
          status: 'archived',
          archivedAt: new Date()
        }
      })
      return NextResponse.json({ 
        success: true, 
        archived: true,
        message: 'Behovet arkiverades eftersom det har förfrågningar' 
      })
    }
    
    // If no requests, delete normally
    await prisma.projectNeed.delete({
      where: { id: parseInt(needId) }
    })
    
    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Error deleting project need:', error)
    return NextResponse.json(
      { error: 'Failed to delete project need' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { needId } = await context.params
    const body = await request.json()
    
    // First check if need exists and get current state
    const currentNeed = await prisma.projectNeed.findUnique({
      where: { id: parseInt(needId) },
      include: {
        _count: {
          select: {
            requests: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    })

    if (!currentNeed) {
      return NextResponse.json(
        { error: 'Behov hittades inte' },
        { status: 404 }
      )
    }

    // Check if quantity is being reduced below accepted count
    if (body.quantity < currentNeed._count.requests) {
      return NextResponse.json(
        { error: `Kan inte minska antalet till ${body.quantity} eftersom ${currentNeed._count.requests} musiker redan har tackat ja` },
        { status: 400 }
      )
    }

    // Check if requests have been sent (strategy and response time become locked)
    const hasRequests = await prisma.request.findFirst({
      where: { projectNeedId: parseInt(needId) }
    })

    const updateData: any = {
      quantity: body.quantity
    }

    // Only update strategy and response time if no requests have been sent
    if (!hasRequests) {
      if (body.requestStrategy) updateData.requestStrategy = body.requestStrategy
      if (body.responseTimeHours !== undefined) updateData.responseTimeHours = body.responseTimeHours
      if (body.maxRecipients !== undefined) updateData.maxRecipients = body.maxRecipients
    }

    const updatedNeed = await prisma.projectNeed.update({
      where: { id: parseInt(needId) },
      data: updateData,
      include: {
        position: {
          include: {
            instrument: true
          }
        },
        rankingList: true
      }
    })

    return NextResponse.json(updatedNeed)
  } catch (error) {
    console.error('Error updating project need:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera behovet' },
      { status: 500 }
    )
  }
}