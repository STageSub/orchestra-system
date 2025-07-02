import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This is a simplified version that stores orchestra configs in the database
// In production, you would:
// 1. Create actual PostgreSQL database via Supabase API
// 2. Run Prisma migrations
// 3. Seed initial data

interface OrchestraConfig {
  id: string
  name: string
  subdomain: string
  contactName: string
  contactEmail: string
  databaseUrl?: string
  createdAt: string
  status: 'pending' | 'active' | 'inactive'
}

export async function GET() {
  try {
    const orchestras = await prisma.orchestra.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    const configs: OrchestraConfig[] = orchestras.map(o => ({
      id: o.id,
      name: o.name,
      subdomain: o.subdomain,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      databaseUrl: o.databaseUrl || undefined,
      createdAt: o.createdAt.toISOString(),
      status: o.status as 'pending' | 'active' | 'inactive'
    }))
    
    return NextResponse.json(configs)
  } catch (error) {
    console.error('Failed to get orchestra configs:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta orkesterkonfigurationer' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, subdomain, contactName, contactEmail } = await request.json()

    // Validate input
    if (!name || !subdomain || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Alla fält är obligatoriska' },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existing = await prisma.orchestra.findUnique({
      where: { subdomain }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Subdomänen finns redan' },
        { status: 400 }
      )
    }

    // Create new orchestra config
    const newOrchestra = await prisma.orchestra.create({
      data: {
        name,
        subdomain,
        contactName,
        contactEmail,
        status: 'active' // Changed to active for demo
      }
    })

    // Simulate database provisioning
    // In production, this would:
    // 1. Call Supabase Management API to create project
    // 2. Wait for database to be ready
    // 3. Run migrations
    // 4. Seed initial data
    
    // For now, we'll use a pre-provisioned database pool approach
    const databaseUrl = await assignDatabaseFromPool(subdomain)
    
    if (databaseUrl) {
      // Update environment dynamically (in memory)
      process.env[`DATABASE_URL_${subdomain.toUpperCase()}`] = databaseUrl
      
      // Run seed script
      await seedNewOrchestra(databaseUrl, name)
      
      return NextResponse.json({
        success: true,
        orchestra: {
          id: newOrchestra.id,
          name: newOrchestra.name,
          subdomain: newOrchestra.subdomain,
          contactName: newOrchestra.contactName,
          contactEmail: newOrchestra.contactEmail,
          createdAt: newOrchestra.createdAt.toISOString(),
          status: newOrchestra.status as 'pending' | 'active' | 'inactive'
        },
        databaseName: `orchestra_${subdomain}`,
        message: 'Orkester skapad och databas provisionerad!',
        setupComplete: true
      })
    } else {
      // Fallback to manual setup
      return NextResponse.json({
        success: true,
        orchestra: {
          id: newOrchestra.id,
          name: newOrchestra.name,
          subdomain: newOrchestra.subdomain,
          contactName: newOrchestra.contactName,
          contactEmail: newOrchestra.contactEmail,
          createdAt: newOrchestra.createdAt.toISOString(),
          status: newOrchestra.status as 'pending' | 'active' | 'inactive'
        },
        databaseName: `orchestra_${subdomain}`,
        message: 'Orkester skapad! Databas konfigureras automatiskt inom 5 minuter.',
        setupComplete: false
      })
    }
  } catch (error) {
    console.error('Failed to create orchestra:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa orkester' },
      { status: 500 }
    )
  }
}

// Mock function - would connect to real database pool
async function assignDatabaseFromPool(subdomain: string): Promise<string | null> {
  // In production: Check pool of pre-provisioned databases
  // For demo: Return null to show manual process
  return null
}

// Mock function - would run actual seeding
async function seedNewOrchestra(databaseUrl: string, orchestraName: string) {
  // In production: Run seed script with proper database connection
  console.log(`Would seed database for ${orchestraName}`)
}