import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth-db'
import { getBrowserInfo } from '@/lib/user-agent'
import { PrismaClient } from '@prisma/client'

const COOKIE_NAME = 'orchestra-admin-session'

export async function GET(request: NextRequest) {
  console.log('[auth-flow] Starting debug...')
  
  const userAgent = request.headers.get('user-agent')
  const browserInfo = getBrowserInfo(userAgent)
  
  // Step 1: Check raw cookie header
  const cookieHeader = request.headers.get('cookie')
  console.log('[auth-flow] Raw cookie header:', cookieHeader)
  
  // Step 2: Try to get cookie using Next.js API
  let nextCookie
  let cookieError
  try {
    const cookieStore = await cookies()
    nextCookie = cookieStore.get(COOKIE_NAME)
    console.log('[auth-flow] Next.js cookie:', nextCookie ? 'found' : 'not found')
  } catch (error) {
    cookieError = error instanceof Error ? error.message : 'Unknown error'
    console.error('[auth-flow] Cookie read error:', error)
  }
  
  // Step 3: Parse cookie manually
  const parsedCookies: Record<string, string> = {}
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        parsedCookies[name] = value
      }
    })
  }
  
  // Step 4: Try to verify token
  let tokenPayload
  let tokenError
  const token = nextCookie?.value || parsedCookies[COOKIE_NAME]
  
  if (token) {
    try {
      tokenPayload = await verifyToken(token)
      console.log('[auth-flow] Token verified:', tokenPayload ? 'valid' : 'invalid')
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Unknown error'
      console.error('[auth-flow] Token verify error:', error)
    }
  }
  
  // Step 5: Try to get current user
  let currentUser
  let userError
  try {
    currentUser = await getCurrentUser()
    console.log('[auth-flow] Current user:', currentUser ? currentUser.username : 'not found')
  } catch (error) {
    userError = error instanceof Error ? error.message : 'Unknown error'
    console.error('[auth-flow] Get user error:', error)
  }
  
  // Step 6: Try direct database query if we have a userId
  let directDbUser
  let dbError
  if (tokenPayload?.userId) {
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
      })
      
      directDbUser = await prisma.user.findUnique({
        where: { id: tokenPayload.userId }
      })
      
      await prisma.$disconnect()
      console.log('[auth-flow] Direct DB user:', directDbUser ? directDbUser.username : 'not found')
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown error'
      console.error('[auth-flow] Direct DB error:', error)
    }
  }
  
  return NextResponse.json({
    browser: browserInfo,
    steps: {
      1: {
        name: 'Raw Cookie Header',
        success: !!cookieHeader,
        value: cookieHeader ? 'Present' : 'Missing',
        raw: cookieHeader
      },
      2: {
        name: 'Next.js Cookie API',
        success: !!nextCookie && !cookieError,
        value: nextCookie ? 'Found' : 'Not found',
        error: cookieError
      },
      3: {
        name: 'Parsed Cookies',
        success: COOKIE_NAME in parsedCookies,
        value: parsedCookies[COOKIE_NAME] ? `${parsedCookies[COOKIE_NAME].substring(0, 20)}...` : 'Not found',
        allCookies: Object.keys(parsedCookies)
      },
      4: {
        name: 'Token Verification',
        success: !!tokenPayload && !tokenError,
        value: tokenPayload ? { 
          userId: tokenPayload.userId,
          authenticated: tokenPayload.authenticated,
          exp: new Date(tokenPayload.exp * 1000).toISOString()
        } : 'Invalid',
        error: tokenError
      },
      5: {
        name: 'Get Current User',
        success: !!currentUser && !userError,
        value: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role
        } : 'Not found',
        error: userError
      },
      6: {
        name: 'Direct Database Query',
        success: !!directDbUser && !dbError,
        value: directDbUser ? {
          id: directDbUser.id,
          username: directDbUser.username,
          active: directDbUser.active
        } : 'Not found',
        error: dbError
      }
    },
    summary: {
      authenticated: !!currentUser,
      cookiePresent: !!token,
      tokenValid: !!tokenPayload,
      userFound: !!currentUser,
      isSafari: browserInfo.isSafari
    }
  })
}