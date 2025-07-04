import { NextResponse } from 'next/server'

export function setAuthCookieOnResponse(response: NextResponse, token: string, isProduction: boolean = false) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction || process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
    // Add domain for production to work across subdomains
    ...(isProduction && {
      domain: '.stagesub.com' // This allows cookie to work on all subdomains
    })
  }
  
  response.cookies.set('orchestra-admin-session', token, cookieOptions)
  
  // Also try setting it as a header for compatibility
  const cookieString = `orchestra-admin-session=${token}; ` +
    `HttpOnly; ` +
    `Max-Age=${cookieOptions.maxAge}; ` +
    `Path=/; ` +
    `SameSite=Lax` +
    (cookieOptions.secure ? '; Secure' : '') +
    (cookieOptions.domain ? `; Domain=${cookieOptions.domain}` : '')
  
  response.headers.set('Set-Cookie', cookieString)
  
  return response
}