import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const take = parseInt(searchParams.get('limit') || '3')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Get communication logs with related data
    const activities = await prismaMultitenant.communicationLog.findMany({
      take,
      skip,
      orderBy: { timestamp: 'desc' },
      include: {
        request: {
          include: {
            musician: true,
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
          }
        }
      }
    })

    // Format activities for display
    const formattedActivities = activities.map(activity => {
      const { request } = activity
      const musicianName = `${request.musician.firstName} ${request.musician.lastName}`
      const projectName = request.projectNeed.project.name
      const position = `${request.projectNeed.position.name} - ${request.projectNeed.position.instrument.name}`

      let description = ''
      let icon = ''
      let color = ''

      switch (activity.type) {
        case 'request_sent':
          description = `Förfrågan skickad till ${musicianName} för ${position} i ${projectName}`
          icon = '📧'
          color = 'text-blue-600'
          break
        case 'reminder_sent':
          description = `Påminnelse skickad till ${musicianName} för ${position} i ${projectName}`
          icon = '🔔'
          color = 'text-yellow-600'
          break
        case 'response_received':
          const status = request.status === 'accepted' ? 'accepterade' : 'avböjde'
          description = `${musicianName} ${status} förfrågan för ${position} i ${projectName}`
          icon = request.status === 'accepted' ? '✅' : '❌'
          color = request.status === 'accepted' ? 'text-green-600' : 'text-red-600'
          break
        case 'confirmation_sent':
          description = `Bekräftelse skickad till ${musicianName} för ${position} i ${projectName}`
          icon = '📨'
          color = 'text-green-600'
          break
        case 'position_filled':
          description = `Position fylld: ${position} i ${projectName}`
          icon = '🎉'
          color = 'text-purple-600'
          break
        default:
          description = `${activity.type} för ${musicianName}`
          icon = '📌'
          color = 'text-gray-600'
      }

      return {
        id: activity.id,
        description,
        icon,
        color,
        timestamp: activity.timestamp,
        type: activity.type
      }
    })

    // Get total count
    const totalCount = await prismaMultitenant.communicationLog.count()

    return NextResponse.json({ 
      activities: formattedActivities,
      total: totalCount,
      hasMore: skip + take < totalCount
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}