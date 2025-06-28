import { NextResponse } from 'next/server'
import { sendReminders } from '@/lib/request-strategies'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const count = await sendReminders()

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error triggering reminders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reminders' },
      { status: 500 }
    )
  }
}