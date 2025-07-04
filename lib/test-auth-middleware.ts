import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-db'
import { logger } from '@/lib/logger'

export async function requireTestAccess(request: NextRequest) {
  // Check if test features are enabled
  if (process.env.ENABLE_TEST_FEATURES !== 'true' && process.env.NODE_ENV === 'production') {
    logger.warn('test', 'Test features accessed but not enabled', {
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return NextResponse.json(
      { error: 'Test features are disabled' },
      { status: 403 }
    )
  }

  // Check authentication
  const user = await getCurrentUser()
  
  if (!user) {
    logger.warn('test', 'Unauthenticated test access attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Check if user has admin role
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    logger.warn('test', 'Unauthorized test access attempt', {
      userId: user.id,
      userRole: user.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  // Log successful test access
  logger.info('test', 'Test endpoint accessed', {
    userId: user.id,
    endpoint: request.url,
    method: request.method,
    metadata: {
      userEmail: user.email,
      userRole: user.role
    }
  })

  // Return user info for the endpoint to use
  return { user }
}