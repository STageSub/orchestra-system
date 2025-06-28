import { NextResponse } from 'next/server'
import { sendReminders, handleTimeouts } from '@/lib/request-strategies'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('Running reminder and timeout checks...')
    
    // Run both checks in parallel
    const [remindersResult, timeoutsResult] = await Promise.allSettled([
      sendReminders(),
      handleTimeouts()
    ])

    const response = {
      timestamp: new Date().toISOString(),
      reminders: remindersResult.status === 'fulfilled' ? 'success' : 'failed',
      timeouts: timeoutsResult.status === 'fulfilled' ? 'success' : 'failed',
      errors: [] as string[]
    }

    if (remindersResult.status === 'rejected') {
      console.error('Reminder check failed:', remindersResult.reason)
      response.errors.push(`Reminders: ${remindersResult.reason}`)
    }

    if (timeoutsResult.status === 'rejected') {
      console.error('Timeout check failed:', timeoutsResult.reason)
      response.errors.push(`Timeouts: ${timeoutsResult.reason}`)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}