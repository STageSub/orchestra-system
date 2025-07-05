import { NextResponse } from 'next/server'

export function setAuthCookieOnResponse(response: NextResponse, token: string, isProduction: boolean = false) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction || process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  }
  
  // Use Next.js built-in cookie handling which properly manages Set-Cookie headers
  response.cookies.set('orchestra-admin-session', token, cookieOptions)
  
  return response
}