import { NextRequest, NextResponse } from 'next/server'
import { getConfiguredCustomers, getPrismaClient } from '@/lib/database-config'

export async function GET(request: NextRequest) {
  try {
    // Get all configured customers
    const customers = getConfiguredCustomers()
    
    let totalMusicians = 0
    let totalProjects = 0
    let activeCustomers = 0
    const customerStats = []
    
    // Query each customer database
    for (const subdomain of customers) {
      try {
        const prisma = getPrismaClient(subdomain)
        
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
          subdomain,
          name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1),
          musicians,
          projects,
          activeProjects,
          lastActivity: lastProject?.createdAt 
            ? new Date(lastProject.createdAt).toLocaleDateString('sv-SE')
            : 'Ingen aktivitet',
          status: activeProjects > 0 ? 'active' : 'inactive'
        })
      } catch (error) {
        console.error(`Failed to get stats for ${subdomain}:`, error)
        // Add placeholder data for failed queries
        customerStats.push({
          subdomain,
          name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1),
          musicians: 0,
          projects: 0,
          activeProjects: 0,
          lastActivity: 'Fel vid hämtning',
          status: 'inactive'
        })
      }
    }
    
    // Calculate revenue based on customer count
    const pricing = {
      small: 299,
      medium: 599,
      large: 999
    }
    
    // Simple revenue calculation - you can make this more sophisticated
    const totalRevenue = customers.length * pricing.small
    
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