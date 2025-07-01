import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-edge'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

const PLAN_PRICES = {
  trial: 0,
  small_ensemble: 79,
  medium_ensemble: 499,
  institution: 1500
}

export async function GET(request: NextRequest) {
  try {
    // Verify superadmin access
    const token = request.cookies.get('orchestra-admin-session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all tenants with subscription info
    const tenants = await prismaMultitenant.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscription: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate subscription counts
    const subscriptionCounts = await prismaMultitenant.tenant.groupBy({
      by: ['subscription'],
      _count: true
    })

    const counts = {
      trial: 0,
      small_ensemble: 0,
      medium_ensemble: 0,
      institution: 0
    }

    subscriptionCounts.forEach(item => {
      counts[item.subscription as keyof typeof counts] = item._count
    })

    // Calculate revenue (mock data for now - will be real when Stripe is integrated)
    const activeSubscriptions = await prismaMultitenant.tenant.findMany({
      where: {
        subscriptionStatus: 'active'
      },
      select: {
        subscription: true
      }
    })

    const monthlyRevenue = activeSubscriptions.reduce((sum, tenant) => {
      return sum + (PLAN_PRICES[tenant.subscription as keyof typeof PLAN_PRICES] || 0)
    }, 0)

    const annualRevenue = monthlyRevenue * 12

    // Mock growth calculation (will be calculated from Stripe data later)
    const growth = 15.7 // 15.7% growth

    return NextResponse.json({
      tenants,
      revenue: {
        monthly: monthlyRevenue,
        annual: annualRevenue,
        growth
      },
      subscriptionCounts: counts
    })
  } catch (error) {
    console.error('Subscription data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}