import { NextRequest, NextResponse } from 'next/server'
import { getConfiguredCustomers, getPrismaClient } from '@/lib/database-config'
import { CustomerService } from '@/lib/services/customer-service'

export async function GET(request: NextRequest) {
  try {
    // Get all configured customers with full details
    const customers = await CustomerService.getCustomers()
    
    let totalMusicians = 0
    let totalProjects = 0
    let activeCustomers = 0
    const customerStats = []
    
    // Query each customer database
    for (const customer of customers) {
      try {
        const prisma = await getPrismaClient(customer.subdomain)
        
        // Get stats for this customer
        const musicians = await prisma.musician.count({
          where: { isActive: true, isArchived: false }
        })
        
        const projects = await prisma.project.count()
        const activeProjects = await prisma.project.count({
          where: {
            startDate: {
              gte: new Date()
            }
          }
        })
        
        // Get last activity
        const lastProject = await prisma.project.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
        
        totalMusicians += musicians
        totalProjects += projects
        if (activeProjects > 0) activeCustomers++
        
        customerStats.push({
          subdomain: customer.subdomain,
          name: customer.name,
          musicians,
          projects,
          activeProjects,
          lastActivity: lastProject?.createdAt 
            ? new Date(lastProject.createdAt).toLocaleDateString('sv-SE')
            : 'Ingen aktivitet',
          status: activeProjects > 0 ? 'active' : 'inactive',
          plan: customer.plan
        })
      } catch (error) {
        console.error(`Failed to get stats for ${customer.subdomain}:`, error)
        // Add placeholder data for failed queries
        customerStats.push({
          subdomain: customer.subdomain,
          name: customer.name,
          musicians: 0,
          projects: 0,
          activeProjects: 0,
          lastActivity: 'Fel vid hämtning',
          status: 'inactive',
          plan: customer.plan
        })
      }
    }
    
    // Calculate revenue based on customer plans
    const pricing = {
      small: 299,
      medium: 599,
      enterprise: 999
    }
    
    // Calculate actual revenue based on plans
    const totalRevenue = customers.reduce((sum, customer) => {
      return sum + (pricing[customer.plan as keyof typeof pricing] || 0)
    }, 0)
    
    return NextResponse.json({
      totalCustomers: customers.length,
      activeCustomers,
      totalMusicians,
      totalProjects,
      totalRevenue,
      growthRate: 0, // Placeholder
      customers: customerStats
    })
  } catch (error) {
    console.error('Error fetching superadmin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}