import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { getPrisma } from '@/lib/prisma'
import { sendRequests } from '@/lib/request-sender'
import { getLogStorage } from '@/lib/log-storage'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  let acceptResponse: any = null
  
  try {
    const prisma = await getPrisma()
  const prisma = await getPrismaForUser(request)
    console.error('\n\n🚀🚀🚀 FULL EMAIL FLOW TEST - START 🚀🚀🚀')
    console.error('Time:', new Date().toISOString())
    
    // Step 1: Find a test project need to use
    console.error('Step 1: Finding test project need...')
    const projectNeed = await prisma.projectNeed.findFirst({
      where: {
        status: { not: 'completed' }
      },
      include: {
        project: true,
        position: {
          include: {
            instrument: true
          }
        }
      }
    })

    if (!projectNeed) {
      return NextResponse.json({
        error: 'No active project need found. Please create a test project first.'
      }, { status: 404 })
    }

    console.error('Found project need:', {
      id: projectNeed.id,
      project: projectNeed.project.name,
      position: projectNeed.position.name
    })

    // Step 2: Send request to Brusk (or first available musician)
    console.error('\nStep 2: Sending request...')
    const musician = await prisma.musician.findFirst({
      where: {
        email: 'brusk.zanganeh@gmail.com',
        isActive: true
      }
    })

    if (!musician) {
      return NextResponse.json({
        error: 'Brusk not found in database. Using first active musician instead.'
      }, { status: 404 })
    }

    console.error('Using musician:', {
      id: musician.id,
      name: `${musician.firstName} ${musician.lastName}`,
      email: musician.email,
      preferredLanguage: musician.preferredLanguage
    })

    // Create a test request
    const testRequest = await prisma.request.create({
      data: {
        musicianId: musician.id,
        projectNeedId: projectNeed.id,
        status: 'pending',
        sentAt: new Date()
      }
    })

    console.error('Created request:', testRequest.id)

    // Generate token
    const { generateRequestToken } = await import('@/lib/request-tokens')
    const token = await generateRequestToken(testRequest.id, projectNeed.responseTimeHours)
    
    console.error('Generated token:', token.substring(0, 20) + '...')

    // Fetch the request with all relations for email
    const fullRequest = await prisma.request.findUnique({
      where: { id: testRequest.id },
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
    })

    if (!fullRequest) {
      throw new Error('Could not fetch request with relations')
    }

    // Send the request email
    const { sendRequestEmail } = await import('@/lib/email')
    await sendRequestEmail(fullRequest, token)
    
    console.error('✅ Request email sent')

    // Step 3: Wait a bit then accept the request
    console.error('\nStep 3: Waiting 2 seconds before accepting...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.error('Wait complete, proceeding to accept...')

    console.error('Accepting request via respond API...')
    // Force localhost for testing
    const respondUrl = 'http://localhost:3001/api/respond'
    
    console.error('Calling respond API at:', respondUrl)
    console.error('With token:', token.substring(0, 20) + '...')
    
    acceptResponse = await fetch(respondUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        response: 'accepted'
      })
    })

    console.error('Accept response status:', acceptResponse.status)
    const acceptResult = await acceptResponse.json()
    console.error('Accept response body:', acceptResult)
    
    if (!acceptResponse.ok) {
      console.error('❌ Accept request failed!')
    }

    // Step 4: Wait a bit then fetch logs
    console.error('\nStep 4: Waiting 1 second for logs to be captured...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get logs from the last 30 seconds
    const logStorage = getLogStorage()
    const since = new Date(Date.now() - 30000) // Last 30 seconds
    const logs = logStorage.getEmailLogs(since)

    console.error(`\nStep 5: Found ${logs.length} email-related logs`)
    
    // Look for key logs
    const respondApiLogs = logs.filter(log => log.message.includes('RESPOND API'))
    const confirmationLogs = logs.filter(log => log.message.includes('CONFIRMATION EMAIL'))
    const languageLogs = logs.filter(log => log.message.includes('language') || log.message.includes('Language'))
    const templateLogs = logs.filter(log => log.message.includes('confirmation_en') || log.message.includes('confirmation template'))

    const summary = {
      success: acceptResponse?.ok || false,
      musician: {
        name: `${musician.firstName} ${musician.lastName}`,
        email: musician.email,
        preferredLanguage: musician.preferredLanguage
      },
      project: projectNeed.project.name,
      position: `${projectNeed.position.instrument.name} - ${projectNeed.position.name}`,
      logs: {
        total: logs.length,
        respondApiCalled: respondApiLogs.length > 0,
        confirmationEmailCalled: confirmationLogs.length > 0,
        languageDetected: languageLogs.map(log => log.message),
        templateUsed: templateLogs.map(log => log.message)
      },
      keyFindings: {
        respondApiReached: respondApiLogs.some(log => log.message.includes('POST START')),
        confirmationTriggered: confirmationLogs.some(log => log.message.includes('START')),
        languageSelected: languageLogs.find(log => log.message.includes('Selected language'))?.message,
        englishTemplateUsed: templateLogs.some(log => log.message.includes('confirmation_en'))
      },
      allLogs: logs.map(log => ({
        time: log.timestamp,
        level: log.level,
        message: log.message.substring(0, 200)
      }))
    }

    console.error('\n🚀🚀🚀 FULL EMAIL FLOW TEST - COMPLETE 🚀🚀🚀')
    
    return NextResponse.json(summary)

  } catch (error) {
    console.error('❌ Full flow test error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}