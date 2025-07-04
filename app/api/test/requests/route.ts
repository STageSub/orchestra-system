import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { requireTestAccess } from '@/lib/test-auth-middleware'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // Check test access
  const authResult = await requireTestAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const prisma = await getPrismaForUser(request)
    const projects = await prisma.project.findMany({
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