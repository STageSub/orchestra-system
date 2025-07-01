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

    // Check if user has completed onboarding
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      select: {
        settings: true,
        _count: {
          select: {
            musicians: true,
            projects: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get onboarding status from tenant settings
    const settings = tenant.settings as any || {}
    const onboardingStatus = settings.onboarding || {
      completed: false,
      completedSteps: []
    }

    // Auto-complete steps based on data
    const completedSteps = [...(onboardingStatus.completedSteps || [])]
    
    // Check if musicians have been added
    if (tenant._count.musicians > 0 && !completedSteps.includes('add_musicians')) {
      completedSteps.push('add_musicians')
    }

    // Check if a project has been created
    if (tenant._count.projects > 0 && !completedSteps.includes('create_project')) {
      completedSteps.push('create_project')
    }

    return NextResponse.json({
      completed: onboardingStatus.completed || false,
      completedSteps,
      hasMusicians: tenant._count.musicians > 0,
      hasProjects: tenant._count.projects > 0
    })

  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}