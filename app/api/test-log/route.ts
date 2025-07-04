import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { getCurrentUser } from '@/lib/auth-db'

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Create a test log entry
  await apiLogger.info(request, 'test', 'Test log entry from API', {
    userId: user.id,
    orchestraId: user.orchestraId,
    metadata: {
      timestamp: new Date().toISOString(),
      userRole: user.role,
      testData: true
    }
  })

  return NextResponse.json({
    message: 'Test log created',
    user: {
      id: user.id,
      orchestraId: user.orchestraId,
      role: user.role
    }
  })
}