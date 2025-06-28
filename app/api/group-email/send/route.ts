import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { recipients, subject, message } = await request.json()

    // Validate input
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Inga mottagare valda' },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Ämne och meddelande krävs' },
        { status: 400 }
      )
    }

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10
    const results = []
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      // Send emails in parallel within batch
      const batchPromises = batch.map(async (recipient: { email: string; name: string }) => {
        try {
          await sendEmail({
            to: recipient.email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="margin: 20px 0; white-space: pre-wrap; line-height: 1.6; font-size: 16px;">${message.replace(/\n/g, '<br>')}</div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Detta meddelande skickades via StageSub Orchestra System.
                </p>
              </div>
            `
          })
          
          return { email: recipient.email, success: true }
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error)
          return { email: recipient.email, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          successCount++
        } else {
          failureCount++
        }
      })

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // TODO: Log the group email activity when CommunicationLog table is added
    // For now, just log to console
    console.log('Group email sent:', {
      subject,
      recipientCount: recipients.length,
      success: successCount,
      failed: failureCount
    })

    // Return response
    if (failureCount === 0) {
      return NextResponse.json({
        success: true,
        message: `E-post skickad till ${successCount} mottagare!`,
        details: {
          sent: successCount,
          failed: failureCount
        }
      })
    } else if (successCount === 0) {
      return NextResponse.json(
        { 
          error: 'Kunde inte skicka e-post till någon mottagare',
          details: {
            sent: successCount,
            failed: failureCount,
            failures: results.filter(r => !r.success)
          }
        },
        { status: 500 }
      )
    } else {
      return NextResponse.json({
        success: true,
        message: `E-post skickad till ${successCount} av ${recipients.length} mottagare. ${failureCount} misslyckades.`,
        details: {
          sent: successCount,
          failed: failureCount,
          failures: results.filter(r => !r.success)
        }
      })
    }
  } catch (error) {
    console.error('Error sending group email:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid utskick av gruppmail' },
      { status: 500 }
    )
  }
}