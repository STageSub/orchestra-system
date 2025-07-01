import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getAuthCookie } from '@/lib/auth-edge'
import { hashPassword } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

// GET /api/superadmin/tenants - List all tenants
export async function GET(request: NextRequest) {
  try {
    // Verify superadmin
    const token = await getAuthCookie()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prismaMultitenant.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get all tenants with counts
    const tenants = await prismaMultitenant.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            musicians: true,
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(tenants)
    
  } catch (error) {
    console.error('List tenants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    // Verify superadmin
    const token = await getAuthCookie()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prismaMultitenant.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Parse request body
    const {
      name,
      subdomain,
      subscription,
      adminEmail,
      adminPassword,
      adminName
    } = await request.json()
    
    // Validate required fields
    if (!name || !subdomain || !subscription || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if subdomain is already taken
    const existingTenant = await prismaMultitenant.tenant.findUnique({
      where: { subdomain }
    })
    
    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      )
    }
    
    // Check if email is already used
    const existingUser = await prismaMultitenant.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }
    
    // Get subscription limits
    const subscriptionLimits = {
      small_ensemble: {
        maxMusicians: 50,
        maxActiveProjects: 5,
        maxInstruments: 10
      },
      medium_ensemble: {
        maxMusicians: 200,
        maxActiveProjects: 20,
        maxInstruments: 99999
      },
      institution: {
        maxMusicians: 99999,
        maxActiveProjects: 99999,
        maxInstruments: 99999
      }
    }
    
    const limits = subscriptionLimits[subscription as keyof typeof subscriptionLimits]
    if (!limits) {
      return NextResponse.json(
        { error: 'Invalid subscription type' },
        { status: 400 }
      )
    }
    
    // Create tenant and admin user in transaction
    const result = await prismaMultitenant.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          subscription,
          ...limits,
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      })
      
      // Hash password
      const hashedPassword = await hashPassword(adminPassword)
      
      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName || 'Admin',
          role: 'admin',
          tenantId: tenant.id
        }
      })
      
      // Create default email templates for the tenant
      const defaultTemplates = [
        {
          type: 'request',
          subject: 'Förfrågan om vikarietjänst - {{projectName}}',
          body: `Hej {{firstName}},

Vi söker en {{positionName}} för {{projectName}} med start {{startDate}}.

Klicka på länken nedan för att svara på förfrågan:
{{responseUrl}}

Vänligen svara inom {{responseTime}} timmar.

Med vänliga hälsningar,
{{orchestraName}}`
        },
        {
          type: 'reminder',
          subject: 'Påminnelse: Förfrågan om vikarietjänst - {{projectName}}',
          body: `Hej {{firstName}},

Detta är en påminnelse om vår förfrågan för {{projectName}}.

Klicka på länken nedan för att svara:
{{responseUrl}}

Med vänliga hälsningar,
{{orchestraName}}`
        },
        {
          type: 'confirmation',
          subject: 'Bekräftelse - {{projectName}}',
          body: `Hej {{firstName}},

Tack för att du accepterat uppdraget som {{positionName}} för {{projectName}}.

Projektstart: {{startDate}}

Vi återkommer med mer information.

Med vänliga hälsningar,
{{orchestraName}}`
        }
      ]
      
      await tx.emailTemplate.createMany({
        data: defaultTemplates.map(template => ({
          ...template,
          tenantId: tenant.id
        }))
      })
      
      return { tenant, adminUser }
    })
    
    return NextResponse.json({
      tenant: result.tenant,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: result.adminUser.name
      }
    })
    
  } catch (error) {
    console.error('Create tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}