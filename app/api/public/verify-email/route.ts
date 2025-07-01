import { NextRequest, NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ 
        error: 'Verification token is required' 
      }, { status: 400 })
    }

    // Find user with this verification token
    const user = await prismaMultitenant.user.findFirst({
      where: {
        verificationToken: token,
        emailVerified: false
      },
      include: {
        tenant: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 })
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - user.createdAt.getTime()
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ 
        error: 'Verification token has expired' 
      }, { status: 400 })
    }

    // Update user to verified
    await prismaMultitenant.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        verificationToken: null // Clear the token
      }
    })

    return NextResponse.json({ 
      success: true,
      subdomain: user.tenant?.subdomain 
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ 
      error: 'Failed to verify email' 
    }, { status: 500 })
  }
}