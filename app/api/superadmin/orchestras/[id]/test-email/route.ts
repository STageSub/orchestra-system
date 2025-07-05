import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

// Initialize central database client
const centralDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkSuperadminAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address required' }, { status: 400 })
    }
    
    // Get orchestra configuration
    const orchestra = await centralDb.orchestra.findUnique({
      where: { id }
    })
    
    if (!orchestra) {
      return NextResponse.json({ error: 'Orchestra not found' }, { status: 404 })
    }
    
    // Check if orchestra has email configuration
    if (!orchestra.resendApiKey) {
      return NextResponse.json({ 
        error: 'No Resend API key configured for this orchestra' 
      }, { status: 400 })
    }
    
    // Initialize Resend with orchestra's API key
    const resend = new Resend(orchestra.resendApiKey)
    
    // Prepare test email
    const fromAddress = orchestra.emailFromAddress || 'no-reply@stagesub.com'
    const fromName = orchestra.emailFromName || orchestra.name
    
    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: testEmail,
        replyTo: orchestra.emailReplyTo || fromAddress,
        subject: `Test Email - ${orchestra.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Email from ${orchestra.name}</h2>
            <p>This is a test email to verify your email configuration.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;" />
            <h3>Current Configuration:</h3>
            <ul style="line-height: 1.8;">
              <li><strong>From Address:</strong> ${fromAddress}</li>
              <li><strong>From Name:</strong> ${fromName}</li>
              <li><strong>Reply To:</strong> ${orchestra.emailReplyTo || fromAddress}</li>
              <li><strong>API Key:</strong> ***${orchestra.resendApiKey.slice(-4)}</li>
            </ul>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;" />
            <p style="color: #666; font-size: 14px;">
              If you received this email, your configuration is working correctly!
            </p>
            <p style="color: #666; font-size: 14px;">
              Sent from StageSub Superadmin Dashboard
            </p>
          </div>
        `,
        text: `Test Email from ${orchestra.name}\n\nThis is a test email to verify your email configuration.\n\nCurrent Configuration:\n- From Address: ${fromAddress}\n- From Name: ${fromName}\n- Reply To: ${orchestra.emailReplyTo || fromAddress}\n- API Key: ***${orchestra.resendApiKey.slice(-4)}\n\nIf you received this email, your configuration is working correctly!\n\nSent from StageSub Superadmin Dashboard`
      })
      
      if (error) {
        console.error('Resend error:', error)
        return NextResponse.json({ 
          error: 'Failed to send test email', 
          details: error.message 
        }, { status: 500 })
      }
      
      // Log successful test
      await centralDb.systemLog.create({
        data: {
          level: 'info',
          category: 'email_test',
          message: `Test email sent successfully for ${orchestra.name}`,
          metadata: {
            orchestraId: id,
            testEmail,
            emailId: data?.id,
            userId: auth.userId
          }
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        emailId: data?.id,
        sentTo: testEmail
      })
      
    } catch (resendError: any) {
      console.error('Resend API error:', resendError)
      
      // Log failed test
      await centralDb.systemLog.create({
        data: {
          level: 'error',
          category: 'email_test',
          message: `Test email failed for ${orchestra.name}`,
          metadata: {
            orchestraId: id,
            testEmail,
            error: resendError.message,
            userId: auth.userId
          }
        }
      })
      
      return NextResponse.json({ 
        error: 'Resend API error', 
        details: resendError.message || 'Unknown error',
        hint: 'Check if the API key is valid and the from address is verified in Resend'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}