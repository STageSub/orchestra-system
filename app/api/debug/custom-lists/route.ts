import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // This is a simple debug endpoint that doesn't touch the database
  const cookieStore = await cookies()
  const token = cookieStore.get('orchestra-admin-session')?.value
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    request: {
      method: request.method,
      url: request.url,
      headers: {
        contentType: request.headers.get('content-type'),
        subdomain: request.headers.get('x-subdomain'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        cookie: !!request.headers.get('cookie')
      }
    },
    auth: {
      hasToken: !!token,
      tokenLength: token?.length || 0
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      vercelEnv: process.env.VERCEL_ENV,
      isProduction: process.env.NODE_ENV === 'production'
    },
    middleware: {
      message: 'If you see this, middleware is not blocking API routes'
    }
  })
}

export async function POST(request: NextRequest) {
  // Test POST request handling
  let body = null
  let bodyError = null
  
  try {
    body = await request.json()
  } catch (error) {
    bodyError = error instanceof Error ? error.message : 'Unknown error'
  }
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    method: 'POST',
    bodyParsed: !!body,
    bodyError,
    bodySize: JSON.stringify(body || {}).length,
    headers: {
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length')
    }
  })
}