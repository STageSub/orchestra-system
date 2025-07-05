import { NextResponse } from 'next/server'

export function setAuthCookieOnResponse(response: NextResponse, token: string, isProduction: boolean = false) {
  const isSecure = isProduction || process.env.NODE_ENV === 'production'
  
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' as const : 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  }
  
  // Use Next.js built-in cookie handling which properly manages Set-Cookie headers
  response.cookies.set('orchestra-admin-session', token, cookieOptions)
  
  return response
}