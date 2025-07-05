import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'

export async function withSuperadminAuth(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await checkSuperadminAuth()
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Superadmin access required' },
        { status: 401 }
      )
    }

    // Add user info to request headers for downstream use
    const modifiedRequest = request.clone() as NextRequest
    modifiedRequest.headers.set('x-user-id', authResult.user?.id || '')
    modifiedRequest.headers.set('x-user-email', authResult.user?.email || '')
    modifiedRequest.headers.set('x-user-role', authResult.user?.role || '')

    return handler(modifiedRequest, ...args)
  }
}