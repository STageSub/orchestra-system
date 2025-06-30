import { NextRequest, NextResponse } from 'next/server'
import { getLogStorage } from '@/lib/log-storage'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter')
    const since = searchParams.get('since')
    const emailOnly = searchParams.get('emailOnly') === 'true'

    const logStorage = getLogStorage()
    
    let logs
    if (emailOnly) {
      logs = logStorage.getEmailLogs(since ? new Date(since) : undefined)
    } else {
      logs = logStorage.getLogs(filter || undefined, since ? new Date(since) : undefined)
    }

    return NextResponse.json({
      logs,
      count: logs.length,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const logStorage = getLogStorage()
    logStorage.clearLogs()
    
    return NextResponse.json({ success: true, message: 'Logs cleared' })
  } catch (error) {
    console.error('Error clearing logs:', error)
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    )
  }
}