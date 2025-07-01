import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { formatHoursToReadable } from '@/lib/utils'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { requestId, type } = await request.json()

    const req = await prismaMultitenant.request.findUnique({
      where: { id: requestId }
    })

    if (!req) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const musician = await prismaMultitenant.musician.findUnique({
      where: { id: req.musicianId }
    })

    const projectNeed = await prismaMultitenant.projectNeed.findUnique({
      where: { id: req.projectNeedId },
      include: {
        project: true,
        position: {
          include: {
            instrument: true
          }
        }
      }
    })

    const token = await prismaMultitenant.requestToken.findFirst({
      where: {
        requestId: req.id,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!musician || !projectNeed) {
      return NextResponse.json(
        { error: 'Request data incomplete' },
        { status: 404 }
      )
    }

    const template = await prismaMultitenant.emailTemplate.findFirst({
      where: { type }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    const tokenString = token?.token || 'test-token'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const responseUrl = `${appUrl}/respond?token=${tokenString}`

    const variables: Record<string, string> = {
      musician_name: `${musician.firstName} ${musician.lastName}`,
      project_name: projectNeed.project.name,
      position: `${projectNeed.position.instrument.name} - ${projectNeed.position.name}`,
      start_date: new Date(projectNeed.project.startDate).toLocaleDateString('sv-SE'),
      end_date: new Date(projectNeed.project.endDate).toLocaleDateString('sv-SE'),
      response_url: responseUrl,
      response_time: formatHoursToReadable(projectNeed.responseTimeHours || 24)
    }

    let subject = template.subject
    let body = template.body

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
      body = body.replace(new RegExp(placeholder, 'g'), value)
    })

    body = body.replace(/\n/g, '<br>')

    return NextResponse.json({
      subject,
      body,
      to: musician.email
    })
  } catch (error) {
    console.error('Error previewing email:', error)
    return NextResponse.json(
      { error: 'Failed to preview email' },
      { status: 500 }
    )
  }
}