import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('[cookie-test] Starting...')
  
  // Test 1: Get cookie from request headers
  const cookieHeader = request.headers.get('cookie')
  console.log('[cookie-test] Raw cookie header:', cookieHeader)
  
  // Test 2: Get cookie using Next.js cookies()
  let nextCookie
  try {
    const cookieStore = await cookies()
    nextCookie = cookieStore.get('orchestra-admin-session')
    console.log('[cookie-test] Next.js cookie:', nextCookie ? 'found' : 'not found')
  } catch (error) {
    console.error('[cookie-test] Error reading with cookies():', error)
  }
  
  // Test 3: Parse cookies manually
  const parsedCookies: Record<string, string> = {}
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        parsedCookies[name] = value
      }
    })
  }
  
  // Test 4: User agent
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return NextResponse.json({
    userAgent,
    rawCookieHeader: cookieHeader || 'none',
    nextJsCookie: nextCookie ? 'found' : 'not found',
    parsedCookies: Object.keys(parsedCookies).length > 0 ? parsedCookies : 'none',
    sessionCookieExists: 'orchestra-admin-session' in parsedCookies
  })
}