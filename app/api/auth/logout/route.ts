import { NextRequest, NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { getCurrentUser } from '@/lib/auth-db'

export async function POST(request: NextRequest) {
  try {
    // Get current user info before logout
    const user = await getCurrentUser()
    
    // Log logout event
    await logger.info('auth', 'User logged out', {
      metadata: {
        userId: user?.id,
        username: user?.username || 'legacy-admin',
        role: user?.role || 'admin',
        orchestraId: user?.orchestraId
      }
    })
    
    await removeAuthCookie()
    
    // Create response with cache-control headers for Safari
    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    // Log error
    await logger.error('auth', `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    // Still remove cookie even if logging fails
    await removeAuthCookie()
    return NextResponse.json({ success: true })
  }
}