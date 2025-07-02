import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/services/customer-service'
import { clearCaches } from '@/lib/database-config'

interface Params {
  params: Promise<{
    id: string
  }>
}

// GET /api/superadmin/customers/[id] - Get single customer
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const customer = await CustomerService.getCustomerById(id)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Kund hittades inte' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Failed to get customer:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta kund' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/customers/[id] - Update customer
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate subdomain format if being changed
    if (body.subdomain && !/^[a-z0-9-]+$/.test(body.subdomain)) {
      return NextResponse.json(
        { error: 'Subdomän får endast innehålla små bokstäver, siffror och bindestreck' },
        { status: 400 }
      )
    }
    
    const customer = await CustomerService.updateCustomer(id, body)
    
    // Clear caches to ensure changes are reflected
    clearCaches()
    
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Failed to update customer:', error)
    return NextResponse.json(
      { error: error.message || 'Kunde inte uppdatera kund' },
      { status: 400 }
    )
  }
}

// DELETE /api/superadmin/customers/[id] - Delete customer
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Get customer first to check if it exists
    const customer = await CustomerService.getCustomerById(id)
    if (!customer) {
      return NextResponse.json(
        { error: 'Kund hittades inte' },
        { status: 404 }
      )
    }
    
    // Only allow deletion of inactive customers
    if (customer.status === 'active') {
      return NextResponse.json(
        { error: 'Kan inte ta bort aktiva kunder. Inaktivera kunden först.' },
        { status: 400 }
      )
    }
    
    await CustomerService.deleteCustomer(id)
    
    // Clear caches
    clearCaches()
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete customer:', error)
    return NextResponse.json(
      { error: error.message || 'Kunde inte ta bort kund' },
      { status: 500 }
    )
  }
}