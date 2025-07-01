import { NextRequest, NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ 
        available: false, 
        error: 'Subdomain is required' 
      }, { status: 400 })
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Invalid subdomain format' 
      }, { status: 400 })
    }

    // Reserved subdomains
    const reserved = ['www', 'app', 'api', 'admin', 'superadmin', 'dashboard', 'demo', 'test']
    if (reserved.includes(subdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'This subdomain is reserved' 
      })
    }

    // Check if subdomain already exists
    const existingTenant = await prismaMultitenant.tenant.findUnique({
      where: { subdomain }
    })

    return NextResponse.json({ 
      available: !existingTenant 
    })

  } catch (error) {
    console.error('Subdomain check error:', error)
    return NextResponse.json({ 
      available: false, 
      error: 'Failed to check subdomain availability' 
    }, { status: 500 })
  }
}