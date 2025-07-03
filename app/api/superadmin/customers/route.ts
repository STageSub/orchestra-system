import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { CustomerService } from '@/lib/services/customer-service'
import { clearCaches } from '@/lib/database-config'

// GET /api/superadmin/customers - List all customers
export async function GET(request: NextRequest) {
  try {
  const prisma = await getPrismaForUser(request)
    const customers = await CustomerService.getAllCustomers()
    
    // Add additional computed fields
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        try {
          // Try to get stats for active customers
          if (customer.status === 'active') {
            const { getPrismaClient } = await import('@/lib/database-config')
            const prisma = await getPrismaClient(customer.subdomain)
            
            const musicianCount = await prisma.musician.count({
              where: { isActive: true, isArchived: false }
            })
            
            const projectCount = await prisma.project.count()
            
            return {
              ...customer,
              musicianCount,
              projectCount
            }
          }
        } catch (error) {
          console.error(`Failed to get stats for ${customer.subdomain}:`, error)
        }
        
        return {
          ...customer,
          musicianCount: 0,
          projectCount: 0
        }
      })
    )
    
    return NextResponse.json(enrichedCustomers)
  } catch (error) {
    console.error('Failed to get customers:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta kunder' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subdomain, contactEmail, plan, databaseUrl } = body
    
    // Validate required fields
    if (!name || !subdomain || !contactEmail || !plan) {
      return NextResponse.json(
        { error: 'Alla fält är obligatoriska' },
        { status: 400 }
      )
    }
    
    // Validate subdomain format (lowercase, no spaces)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomän får endast innehålla små bokstäver, siffror och bindestreck' },
        { status: 400 }
      )
    }
    
    const customer = await CustomerService.addCustomer({
      name,
      subdomain,
      contactEmail,
      plan,
      databaseUrl: databaseUrl || `env:DATABASE_URL_${subdomain.toUpperCase()}`,
      status: 'pending'
    })
    
    // Clear caches to ensure new customer is recognized
    clearCaches()
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Failed to create customer:', error)
    return NextResponse.json(
      { error: error.message || 'Kunde inte skapa kund' },
      { status: 400 }
    )
  }
}