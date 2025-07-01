import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { getCurrentTenant } from '@/lib/tenant-context'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
    }

    // Get tenant subscription info
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscription: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Calculate trial status
    const now = new Date()
    const isOnTrial = tenant.subscriptionStatus === 'trialing'
    let daysRemaining = 0
    
    if (isOnTrial && tenant.trialEndsAt) {
      const trialEnd = new Date(tenant.trialEndsAt)
      const diffTime = trialEnd.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Don't show negative days
      if (daysRemaining < 0) {
        daysRemaining = 0
      }
    }

    return NextResponse.json({
      isOnTrial,
      daysRemaining,
      trialEndsAt: tenant.trialEndsAt,
      plan: tenant.subscription,
      subscriptionStatus: tenant.subscriptionStatus,
      currentPeriodEnd: tenant.currentPeriodEnd
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}