import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { getSystemLogs } from '@/lib/logger'

export async function GET(request: NextRequest) {
  console.log('[system-logs API] Starting...')
  
  // Check authentication
  const user = await getCurrentUser()
  console.log('[system-logs API] User:', user?.email, user?.role, user?.orchestraId)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Only admins can view system logs
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  console.log('[system-logs API] Query params:', Object.fromEntries(searchParams.entries()))
  
  try {
    const logs = await getSystemLogs({
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      category: searchParams.get('category') as any,
      level: searchParams.get('level') as any,
      search: searchParams.get('search') || undefined,
      userId: searchParams.get('userId') || undefined,
      request: request // Pass the request so it can determine the correct database
    })

    console.log('[system-logs API] Found logs:', logs.logs?.length, 'Total:', logs.total)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}