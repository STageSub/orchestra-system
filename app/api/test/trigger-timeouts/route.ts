import { NextResponse } from 'next/server'
import { handleTimeouts } from '@/lib/request-strategies'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const count = await handleTimeouts()

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error triggering timeouts:', error)
    return NextResponse.json(
      { error: 'Failed to trigger timeouts' },
      { status: 500 }
    )
  }
}