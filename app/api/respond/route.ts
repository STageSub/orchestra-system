import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendConfirmationEmail, sendPositionFilledEmail } from '@/lib/email'
import { ensureLogStorage } from '@/lib/server-init'

// Initialize log storage for this API route
ensureLogStorage()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token saknas' },
      { status: 400 }
    )
  }

  try {
    // Find token and validate
    const requestToken = await prisma.requestToken.findUnique({
      where: { token },
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

    if (!requestToken) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 404 }
      )
    }

    if (requestToken.usedAt) {
      return NextResponse.json(
        { error: 'Denna token har redan använts' },
        { status: 400 }
      )
    }

    // Check if request is still pending
    if (requestToken.request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Denna förfrågan är inte längre aktiv' },
        { status: 400 }
      )
    }

    // Return request details for the response page
    return NextResponse.json({
      request: {
        id: requestToken.request.id,
        musician: {
          firstName: requestToken.request.musician.firstName,
          lastName: requestToken.request.musician.lastName
        },
        project: {
          name: requestToken.request.projectNeed.project.name,
          startDate: requestToken.request.projectNeed.project.startDate,
          weekNumber: requestToken.request.projectNeed.project.weekNumber,
          rehearsalSchedule: requestToken.request.projectNeed.project.rehearsalSchedule,
          concertInfo: requestToken.request.projectNeed.project.concertInfo
        },
        position: {
          instrument: requestToken.request.projectNeed.position.instrument.name,
          name: requestToken.request.projectNeed.position.name
        },
        responseTimeHours: requestToken.request.projectNeed.responseTimeHours
      }
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Force log storage initialization
  const logStorage = ensureLogStorage()
  
  console.error('\n\n🔥🔥🔥 RESPOND API - POST START 🔥🔥🔥')
  console.error('Time:', new Date().toISOString())
  console.error('URL:', request.url)
  console.error('Headers:', Object.fromEntries(request.headers.entries()))
  console.error('Log storage initialized:', !!logStorage)
  
  try {
    const body = await request.json()
    console.error('=== RESPOND API - Request Body ===')
    console.error('Full body:', JSON.stringify(body, null, 2))
    
    const { token, response } = body
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'MISSING')
    console.log('Response:', response)

    if (!token || !response || !['accepted', 'declined'].includes(response)) {
      console.error('=== RESPOND API - Validation Failed ===')
      console.error('Token present:', !!token)
      console.error('Response present:', !!response)
      console.error('Response valid:', ['accepted', 'declined'].includes(response))
      return NextResponse.json(
        { error: 'Ogiltig förfrågan - token eller svar saknas' },
        { status: 400 }
      )
    }
    
    console.log('=== RESPOND API - Starting Transaction ===')

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('=== RESPOND API - Finding Token ===')
      
      // Find and validate token
      const requestToken = await tx.requestToken.findUnique({
        where: { token },
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

      console.log('=== RESPOND API - Token Search Result ===')
      console.log('Token found:', !!requestToken)
      
      if (!requestToken) {
        console.error('Token not found:', token)
        throw new Error('Invalid token - token not found')
      }
      
      console.log('Token details:')
      console.log('- Token ID:', requestToken.id)
      console.log('- Request ID:', requestToken.requestId)
      console.log('- Used at:', requestToken.usedAt)
      console.log('- Expires at:', requestToken.expiresAt)
      
      if (requestToken.usedAt) {
        console.error('=== RESPOND API - Token Already Used ===')
        console.error('Token:', token)
        console.error('Used at:', requestToken.usedAt)
        throw new Error('Token already used')
      }

      console.log('=== RESPOND API - Request Details ===')
      console.log('Request ID:', requestToken.request.id)
      console.log('Request status:', requestToken.request.status)
      console.log('Responded at:', requestToken.request.respondedAt)
      console.log('Musician:', requestToken.request.musician.firstName, requestToken.request.musician.lastName)
      
      if (requestToken.request.status !== 'pending') {
        console.error('=== RESPOND API - Request Not Pending ===')
        console.error('Status:', requestToken.request.status)
        console.error('Request ID:', requestToken.request.id)
        throw new Error('Request is no longer pending')
      }
      
      // Extra check - if respondedAt is set, the request was already handled
      if (requestToken.request.respondedAt) {
        console.error('=== RESPOND API - Request Already Responded ===')
        console.error('Request ID:', requestToken.request.id)
        console.error('Responded at:', requestToken.request.respondedAt)
        throw new Error('Request already responded')
      }

      // Mark token as used
      console.log('=== RESPOND API - Marking Token as Used ===')
      console.log('Token:', requestToken.token.substring(0, 20) + '...')
      const tokenUpdate = await tx.requestToken.update({
        where: { token: requestToken.token },
        data: { usedAt: new Date() }
      })
      console.log('Token marked as used at:', tokenUpdate.usedAt)

      // Update request status
      console.log('=== RESPOND API - Updating Request Status ===')
      console.log('Request ID:', requestToken.request.id)
      console.log('New status:', response)
      const updatedRequest = await tx.request.update({
        where: { id: requestToken.request.id },
        data: {
          status: response,
          respondedAt: new Date()
        }
      })
      console.log('Request updated:')
      console.log('- Status:', updatedRequest.status)
      console.log('- Responded at:', updatedRequest.respondedAt)

      // Log the response
      console.log('=== RESPOND API - Creating Communication Log ===')
      const commLog = await tx.communicationLog.create({
        data: {
          requestId: requestToken.request.id,
          type: 'response_received',
          timestamp: new Date()
        }
      })
      console.log('Communication log created:', commLog.id)

      const { projectNeed } = requestToken.request

      if (response === 'accepted') {
        console.log('=== RESPOND API - Handling Accepted Response ===')
        // Check if need is now fulfilled
        const acceptedCount = await tx.request.count({
          where: {
            projectNeedId: projectNeed.id,
            status: 'accepted'
          }
        })
        console.log('Accepted count for need:', acceptedCount)
        console.log('Quantity needed:', projectNeed.quantity)

        if (acceptedCount >= projectNeed.quantity) {
          console.log('Need is now fulfilled!')
          // Mark need as completed
          await tx.projectNeed.update({
            where: { id: projectNeed.id },
            data: { status: 'completed' }
          })

          // If strategy is "first_come", cancel pending requests
          if (projectNeed.requestStrategy === 'first_come') {
            const pendingRequests = await tx.request.findMany({
              where: {
                projectNeedId: projectNeed.id,
                status: 'pending'
              }
            })

            // Update all pending requests to cancelled
            await tx.request.updateMany({
              where: {
                projectNeedId: projectNeed.id,
                status: 'pending'
              },
              data: { 
                status: 'cancelled',
                respondedAt: new Date()
              }
            })

            // Send position filled emails to pending requests
            for (const req of pendingRequests) {
              // Fetch full request data with relations for email language support
              const fullRequest = await tx.request.findUnique({
                where: { id: req.id },
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
              
              if (fullRequest) {
                await sendPositionFilledEmail(fullRequest)
              }
            }
          }
        }
      } else if (response === 'declined') {
        console.log('=== RESPOND API - Declined Response ===')
        console.log('Request ID:', requestToken.request.id)
        console.log('Project Need ID:', projectNeed.id)
        console.log('Strategy:', projectNeed.requestStrategy)
        console.log('Will handle declined request AFTER transaction completes')
      }

      console.log('=== RESPOND API - Transaction Logic Complete ===')
      console.log('Response type:', response)
      console.log('Will send confirmation email AFTER transaction if accepted')

      console.log('=== RESPOND API - Transaction Complete ===')
      console.log('Request ID:', requestToken.request.id)
      console.log('Final status:', response)
      console.log('Transaction successful!')
      
      return { request: requestToken.request, response }
    })

    // Handle post-transaction actions OUTSIDE transaction to avoid timeouts
    if (response === 'declined') {
      console.log('=== RESPOND API - Post-Transaction Declined Handling ===')
      try {
        console.log('Importing handleDeclinedRequest...')
        const { handleDeclinedRequest } = await import('@/lib/request-handlers')
        console.log('Calling handleDeclinedRequest outside transaction...')
        await handleDeclinedRequest(result.request.id)
        console.log('✅ Successfully handled declined request post-transaction')
      } catch (declineError) {
        // Log error but don't fail the response - the decline is still recorded
        console.error('❌ Error handling declined request (non-fatal):')
        console.error('Error type:', declineError instanceof Error ? declineError.constructor.name : typeof declineError)
        console.error('Error message:', declineError instanceof Error ? declineError.message : String(declineError))
        console.error('Error stack:', declineError instanceof Error ? declineError.stack : 'No stack trace')
        console.log('⚠️ Decline was recorded, but follow-up failed')
      }
    } else if (response === 'accepted') {
      console.error('\n🔥🔥🔥 RESPOND API - Post-Transaction Accepted Handling 🔥🔥🔥')
      try {
        console.error('Sending confirmation email for ACCEPTED response...')
        console.error('Request object being sent to sendConfirmationEmail:')
        console.error('- Request ID:', result.request.id)
        console.error('- Has musician?', !!result.request.musician)
        if (result.request.musician) {
          console.error('- Musician name:', result.request.musician.firstName, result.request.musician.lastName)
          console.error('- Musician email:', result.request.musician.email)
          console.error('- Musician preferredLanguage:', result.request.musician.preferredLanguage)
          console.error('- Type of preferredLanguage:', typeof result.request.musician.preferredLanguage)
        }
        console.error('- Has projectNeed?', !!result.request.projectNeed)
        if (result.request.projectNeed) {
          console.error('- Project name:', result.request.projectNeed.project?.name)
        }
        console.error('🔥 CALLING sendConfirmationEmail NOW...')
        await sendConfirmationEmail(result.request)
        console.error('✅🔥 Confirmation email sent successfully post-transaction 🔥✅')
      } catch (emailError) {
        // Log error but don't fail the response - the acceptance is still recorded
        console.error('❌ Error sending confirmation email (non-fatal):')
        console.error('Error type:', emailError instanceof Error ? emailError.constructor.name : typeof emailError)
        console.error('Error message:', emailError instanceof Error ? emailError.message : String(emailError))
        console.error('Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace')
        console.log('⚠️ Acceptance was recorded, but confirmation email failed')
      }
    }

    console.log('=== RESPOND API - Sending Success Response ===')
    console.log('Transaction result:', result)
    const successMessage = response === 'accepted' 
      ? 'Tack för ditt svar! Vi skickar mer information via e-post.'
      : 'Tack för ditt svar. Vi hör av oss vid nästa tillfälle.'
    console.log('Success message:', successMessage)
    
    return NextResponse.json({
      success: true,
      message: successMessage
    })
  } catch (error) {
    console.error('=== RESPOND API - ERROR CAUGHT ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid token')) {
        return NextResponse.json(
          { error: 'Ogiltig eller utgången token' },
          { status: 404 }
        )
      }
      if (error.message.includes('already used')) {
        return NextResponse.json(
          { error: 'Denna token har redan använts' },
          { status: 400 }
        )
      }
      if (error.message.includes('no longer pending')) {
        return NextResponse.json(
          { error: 'Denna förfrågan är inte längre aktiv' },
          { status: 400 }
        )
      }
    }
    
    console.log('Returning 500 error with generic message')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.log('Error details:', errorMessage)
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Ett fel uppstod när vi skulle registrera ditt svar. Vänligen kontakta administratören.',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}