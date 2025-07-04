import { NextRequest, NextResponse } from 'next/server'
import { createToken, verifyPassword, verifySuperadminPassword } from '@/lib/auth'
import { authenticateUser, createToken as createDbToken } from '@/lib/auth-db'
import { getSubdomain } from '@/lib/database-config'

export async function POST(request: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {} as any,
    auth: {} as any,
    environment: {} as any,
    result: {} as any
  }

  try {
    const body = await request.json()
    const { username, password, loginType = 'admin' } = body
    
    debugInfo.request = {
      hasUsername: !!username,
      username: username || 'not provided',
      hasPassword: !!password,
      loginType,
      host: request.headers.get('host'),
      subdomain: getSubdomain(request.headers.get('host') || '')
    }
    
    debugInfo.environment = {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      hasSuperadminPassword: !!process.env.SUPERADMIN_PASSWORD
    }
    
    if (!password) {
      debugInfo.result = { error: 'No password provided' }
      return NextResponse.json(debugInfo, { status: 400 })
    }
    
    // Check if using new database authentication
    if (username) {
      debugInfo.auth.method = 'database'
      
      try {
        const user = await authenticateUser(username, password)
        debugInfo.auth.userFound = !!user
        
        if (!user) {
          debugInfo.result = { error: 'Authentication failed' }
          return NextResponse.json(debugInfo, { status: 401 })
        }
        
        debugInfo.auth.userId = user.id
        debugInfo.auth.userRole = user.role
        
        // Create token
        const token = await createDbToken(user, debugInfo.request.subdomain)
        debugInfo.auth.tokenCreated = !!token
        debugInfo.auth.tokenLength = token?.length || 0
        
        debugInfo.result = { success: true, role: user.role }
        return NextResponse.json(debugInfo)
        
      } catch (error) {
        debugInfo.auth.error = error instanceof Error ? error.message : 'Unknown error'
        debugInfo.result = { error: 'Database auth error' }
        return NextResponse.json(debugInfo, { status: 500 })
      }
      
    } else {
      debugInfo.auth.method = 'environment'
      
      let isValid = false
      let role = 'admin'
      
      if (loginType === 'superadmin') {
        isValid = await verifySuperadminPassword(password)
        role = 'superadmin'
        debugInfo.auth.checkedSuperadmin = true
      } else {
        isValid = await verifyPassword(password)
        role = 'admin'
        debugInfo.auth.checkedAdmin = true
      }
      
      debugInfo.auth.passwordValid = isValid
      
      if (!isValid) {
        debugInfo.result = { error: 'Invalid password' }
        return NextResponse.json(debugInfo, { status: 401 })
      }
      
      // Create token
      const token = await createToken(undefined, role, debugInfo.request.subdomain)
      debugInfo.auth.tokenCreated = !!token
      debugInfo.auth.tokenLength = token?.length || 0
      
      debugInfo.result = { success: true, role }
      return NextResponse.json(debugInfo)
    }
    
  } catch (error) {
    debugInfo.result = { 
      error: 'Fatal error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    return NextResponse.json(debugInfo, { status: 500 })
  }
}