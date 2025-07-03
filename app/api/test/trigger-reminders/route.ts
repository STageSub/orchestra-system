import { NextResponse } from 'next/server'
import { sendReminders } from '@/lib/request-handlers'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    // Use getPrismaForUser to get the correct database based on auth
    const prisma = await getPrismaForUser()
    const count = await sendReminders(prisma)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error triggering reminders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reminders' },
      { status: 500 }
    )
  }
}