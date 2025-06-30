import { NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    console.error('\n🔥🔥🔥 TEST CONFIRMATION EMAIL ENDPOINT 🔥🔥🔥')
    console.error('Time:', new Date().toISOString())
    
    // Create a mock request with full data structure
    const mockRequest = {
      id: 999,
      musicianId: 1, // Assuming Brusk is musician ID 1
      projectNeedId: 1,
      musician: {
        id: 1,
        firstName: 'Brusk',
        lastName: 'Zanganeh',
        email: 'brusk.zanganeh@gmail.com',
        preferredLanguage: 'en' // Set to English
      },
      projectNeed: {
        id: 1,
        project: {
          id: 1,
          name: 'Test Project',
          startDate: new Date('2025-07-15'),
          weekNumber: 29,
          rehearsalSchedule: 'Tuesdays 19:00',
          concertInfo: 'Saturday 20:00'
        },
        position: {
          id: 1,
          name: 'First Violin',
          instrument: {
            id: 1,
            name: 'Violin'
          }
        }
      }
    }
    
    console.error('Sending test confirmation email with mock data...')
    console.error('Mock musician language:', mockRequest.musician.preferredLanguage)
    console.error('Expected: Email should be sent in ENGLISH because preferredLanguage = "en"')
    
    await sendConfirmationEmail(mockRequest)
    
    console.error('✅🔥 Test confirmation email sent successfully! 🔥✅')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test confirmation email sent successfully'
    })
  } catch (error) {
    console.error('❌ Error sending test confirmation email:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { error: 'Failed to send test confirmation email', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}