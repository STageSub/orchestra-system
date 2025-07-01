import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

const SUBSCRIPTION_LIMITS = {
  trial: {
    maxMusicians: 50,
    maxActiveProjects: 5,
    maxInstruments: 10
  },
  small_ensemble: {
    maxMusicians: 50,
    maxActiveProjects: 5,
    maxInstruments: 10
  },
  medium_ensemble: {
    maxMusicians: 200,
    maxActiveProjects: 20,
    maxInstruments: 999999
  },
  institution: {
    maxMusicians: 999999,
    maxActiveProjects: 999999,
    maxInstruments: 999999
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify superadmin access
    const token = request.cookies.get('orchestra-admin-session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { subscription } = await request.json()

    // Validate subscription
    if (!SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS]) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Get the new limits
    const limits = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS]

    // Update tenant subscription and limits
    const updatedTenant = await prismaMultitenant.tenant.update({
      where: { id },
      data: {
        subscription,
        maxMusicians: limits.maxMusicians,
        maxActiveProjects: limits.maxActiveProjects,
        maxInstruments: limits.maxInstruments,
        // If upgrading from trial, activate the subscription
        subscriptionStatus: subscription !== 'trial' ? 'active' : 'trialing',
        // Reset trial end date if moving to paid plan
        trialEndsAt: subscription !== 'trial' ? null : undefined,
        updatedAt: new Date()
      }
    })

    // In a real implementation, this would also:
    // 1. Create/update Stripe subscription
    // 2. Handle prorated charges
    // 3. Send confirmation emails
    // 4. Update billing information

    return NextResponse.json({
      success: true,
      tenant: updatedTenant
    })
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}