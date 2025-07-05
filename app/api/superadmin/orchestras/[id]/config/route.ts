import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { PrismaClient } from '@prisma/client'

// Initialize central database client
const centralDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkSuperadminAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    
    const orchestra = await centralDb.orchestra.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        // Email Configuration
        resendApiKey: true,
        emailFromAddress: true,
        emailFromName: true,
        emailReplyTo: true,
        // Feature Toggles
        features: true,
        // Branding
        primaryColor: true,
        secondaryColor: true,
        customDomain: true,
        faviconUrl: true,
        // API & Integrations
        apiKey: true,
        webhookUrl: true,
        webhookSecret: true,
      }
    })
    
    if (!orchestra) {
      return NextResponse.json({ error: 'Orchestra not found' }, { status: 404 })
    }
    
    // Mask sensitive data for security
    const config = {
      ...orchestra,
      resendApiKey: orchestra.resendApiKey ? '***' + orchestra.resendApiKey.slice(-4) : null,
      webhookSecret: orchestra.webhookSecret ? '***' + orchestra.webhookSecret.slice(-4) : null,
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to get orchestra configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkSuperadminAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const data = await request.json()
    
    // Check if orchestra exists
    const orchestra = await centralDb.orchestra.findUnique({
      where: { id }
    })
    
    if (!orchestra) {
      return NextResponse.json({ error: 'Orchestra not found' }, { status: 404 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    // Email Configuration
    if (data.resendApiKey !== undefined && !data.resendApiKey.includes('***')) {
      updateData.resendApiKey = data.resendApiKey
    }
    if (data.emailFromAddress !== undefined) {
      updateData.emailFromAddress = data.emailFromAddress
    }
    if (data.emailFromName !== undefined) {
      updateData.emailFromName = data.emailFromName
    }
    if (data.emailReplyTo !== undefined) {
      updateData.emailReplyTo = data.emailReplyTo
    }
    
    // Feature Toggles
    if (data.features !== undefined) {
      updateData.features = data.features
    }
    
    // Branding
    if (data.primaryColor !== undefined) {
      updateData.primaryColor = data.primaryColor
    }
    if (data.secondaryColor !== undefined) {
      updateData.secondaryColor = data.secondaryColor
    }
    if (data.customDomain !== undefined) {
      updateData.customDomain = data.customDomain
    }
    if (data.faviconUrl !== undefined) {
      updateData.faviconUrl = data.faviconUrl
    }
    
    // API & Integrations
    if (data.apiKey !== undefined) {
      // Generate new API key if requested
      if (data.apiKey === 'generate') {
        const crypto = await import('crypto')
        updateData.apiKey = `sk_${orchestra.subdomain}_${crypto.randomBytes(24).toString('hex')}`
      } else {
        updateData.apiKey = data.apiKey
      }
    }
    if (data.webhookUrl !== undefined) {
      updateData.webhookUrl = data.webhookUrl
    }
    if (data.webhookSecret !== undefined && !data.webhookSecret.includes('***')) {
      updateData.webhookSecret = data.webhookSecret
    }
    
    // Update orchestra
    const updated = await centralDb.orchestra.update({
      where: { id },
      data: updateData
    })
    
    // Log configuration change
    await centralDb.systemLog.create({
      data: {
        level: 'info',
        category: 'orchestra_config',
        message: `Orchestra configuration updated for ${orchestra.name}`,
        metadata: {
          orchestraId: id,
          changedFields: Object.keys(updateData),
          userId: auth.userId
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      orchestra: {
        id: updated.id,
        name: updated.name,
        subdomain: updated.subdomain
      }
    })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update orchestra configuration' },
      { status: 500 }
    )
  }
}