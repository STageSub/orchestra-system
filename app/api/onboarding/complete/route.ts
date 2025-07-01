import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { getCurrentTenant } from '@/lib/tenant-context'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
    }

    // Get current tenant settings
    const tenant = await prismaMultitenant.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Mark onboarding as completed
    const settings = tenant.settings as any || {}
    settings.onboarding = {
      ...settings.onboarding,
      completed: true,
      completedAt: new Date().toISOString()
    }

    // Update tenant settings
    await prismaMultitenant.tenant.update({
      where: { id: tenantId },
      data: { settings }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completed successfully' 
    })

  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}