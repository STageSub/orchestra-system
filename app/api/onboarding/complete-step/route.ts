import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { getCurrentTenant } from '@/lib/tenant-context'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
    }

    const { stepId } = await request.json()
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // Get current tenant settings
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Update onboarding status
    const settings = tenant.settings as any || {}
    const onboarding = settings.onboarding || {
      completed: false,
      completedSteps: []
    }

    // Add step if not already completed
    if (!onboarding.completedSteps.includes(stepId)) {
      onboarding.completedSteps.push(stepId)
    }

    // Update tenant settings
    await prismaMultitenant.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          onboarding
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      completedSteps: onboarding.completedSteps 
    })

  } catch (error) {
    console.error('Complete step error:', error)
    return NextResponse.json(
      { error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}