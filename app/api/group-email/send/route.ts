import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { apiLogger } from '@/lib/logger'
import { EmailRateLimiter } from '@/lib/email/rate-limiter'

export async function POST(request: NextRequest) {
  let recipients: any[] = []
  let subject = ''
  
  try {
    const prisma = await getPrismaForUser(request)
    const body = await request.json()
    recipients = body.recipients
    subject = body.subject
    const message = body.message
    const metadata = body.metadata

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

    // Use rate limiter for sending emails
    const processedResults: Array<{ email: string; success: boolean; error?: string }> = []
    let successCount = 0
    let failureCount = 0

    // Send emails using rate limiter
    const results = await EmailRateLimiter.sendBatch(
      recipients,
      async (recipient: { email: string; name: string }) => {
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
      },
      (sent, total, currentBatch) => {
        console.log(`📧 Sending group emails: ${sent}/${total} - Current batch: ${currentBatch.join(', ')}`)
      }
    )

    // Process results
    results.forEach((result, index) => {
      const recipient = recipients[index]
      if (result.status === 'fulfilled') {
        const res = result.value
        processedResults.push(res)
        if (res.success) {
          successCount++
        } else {
          failureCount++
        }
      } else {
        // Rejected promise
        processedResults.push({ 
          email: recipient.email, 
          success: false, 
          error: result.reason?.message || 'Unknown error' 
        })
        failureCount++
      }
    })

    // Log the group email activity
    try {
      await prisma.groupEmailLog.create({
        data: {
          projectId: metadata?.projectId ? parseInt(metadata.projectId) : null,
          subject,
          message,
          recipients,
          sentCount: successCount,
          failedCount: failureCount,
          filters: metadata?.filters || null
        }
      })
    } catch (logError) {
      console.error('Failed to log group email:', logError)
      // Don't fail the request if logging fails
    }
    
    // Log group email operation
    await apiLogger.info(request, 'email', 'Group email sent', {
      metadata: {
        subject,
        recipientCount: recipients.length,
        successCount,
        failureCount,
        projectId: metadata?.projectId || null,
        filters: metadata?.filters || null
      }
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
            failures: processedResults.filter(r => !r.success)
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
          failures: processedResults.filter(r => !r.success)
        }
      })
    }
  } catch (error) {
    console.error('Error sending group email:', error)
    
    // Log error
    await apiLogger.error(request, 'email', `Group email failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        subject,
        recipientCount: recipients?.length || 0,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid utskick av gruppmail' },
      { status: 500 }
    )
  }
}