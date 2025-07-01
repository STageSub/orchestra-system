import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const projects = await prismaMultitenant.project.findMany({
      where: {
        projectNeeds: {
          some: {
            requests: {
              some: {}
            }
          }
        }
      },
      include: {
        projectNeeds: {
          where: {
            requests: {
              some: {}
            }
          },
          include: {
            position: {
              include: {
                instrument: true
              }
            },
            requests: {
              include: {
                musician: true,
                requestTokens: {
                  orderBy: { createdAt: 'desc' }
                },
                communicationLogs: {
                  orderBy: { timestamp: 'desc' }
                }
              },
              orderBy: { sentAt: 'desc' }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching test data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test data' },
      { status: 500 }
    )
  }
}