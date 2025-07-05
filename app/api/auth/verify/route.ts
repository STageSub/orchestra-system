import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const COOKIE_NAME = 'orchestra-admin-session'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false, 
        error: 'No token found' 
      })
    }
    
    const payload = await verifyToken(token)
    
    if (!payload || !payload.authenticated) {
      return NextResponse.json({ 
        authenticated: false, 
        error: 'Invalid token' 
      })
    }
    
    return NextResponse.json({
      authenticated: true,
      role: payload.role || 'admin',
      userId: payload.userId
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Verification failed' 
    })
  }
}