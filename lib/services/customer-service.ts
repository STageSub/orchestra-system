import { getPrisma } from '@/lib/prisma'

export interface Customer {
  id: string
  name: string
  subdomain: string
  databaseUrl: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  contactEmail: string
  plan: 'small' | 'medium' | 'enterprise'
}

export interface CustomerConfig {
  customers: Customer[]
}

export class CustomerService {
  static async getCustomers(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    })
    
    return customers.map(c => ({
      ...c,
      status: c.status as 'active' | 'inactive' | 'pending',
      plan: c.plan as 'small' | 'medium' | 'enterprise',
      createdAt: c.createdAt.toISOString()
    }))
  }

  static async getAllCustomers(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return customers.map(c => ({
      ...c,
      status: c.status as 'active' | 'inactive' | 'pending',
      plan: c.plan as 'small' | 'medium' | 'enterprise',
      createdAt: c.createdAt.toISOString()
    }))
  }

  static async getCustomerBySubdomain(subdomain: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { subdomain }
    })
    
    if (!customer) return null
    
    return {
      ...customer,
      status: customer.status as 'active' | 'inactive' | 'pending',
      plan: customer.plan as 'small' | 'medium' | 'enterprise',
      createdAt: customer.createdAt.toISOString()
    }
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id }
    })
    
    if (!customer) return null
    
    return {
      ...customer,
      status: customer.status as 'active' | 'inactive' | 'pending',
      plan: customer.plan as 'small' | 'medium' | 'enterprise',
      createdAt: customer.createdAt.toISOString()
    }
  }

  static async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    // Check if subdomain already exists
    const existing = await prisma.customer.findUnique({
      where: { subdomain: customer.subdomain }
    })
    
    if (existing) {
      throw new Error('Subdomänen finns redan')
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: customer.name,
        subdomain: customer.subdomain,
        databaseUrl: customer.databaseUrl,
        status: customer.status,
        contactEmail: customer.contactEmail,
        plan: customer.plan
      }
    })
    
    return {
      ...newCustomer,
      status: newCustomer.status as 'active' | 'inactive' | 'pending',
      plan: newCustomer.plan as 'small' | 'medium' | 'enterprise',
      createdAt: newCustomer.createdAt.toISOString()
    }
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      // Check subdomain uniqueness if being changed
      if (updates.subdomain) {
        const existing = await prisma.customer.findFirst({
          where: { 
            subdomain: updates.subdomain,
            NOT: { id }
          }
        })
        
        if (existing) {
          throw new Error('Subdomänen finns redan')
        }
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: {
          name: updates.name,
          subdomain: updates.subdomain,
          databaseUrl: updates.databaseUrl,
          status: updates.status,
          contactEmail: updates.contactEmail,
          plan: updates.plan
        }
      })
      
      return {
        ...updatedCustomer,
        status: updatedCustomer.status as 'active' | 'inactive' | 'pending',
        plan: updatedCustomer.plan as 'small' | 'medium' | 'enterprise',
        createdAt: updatedCustomer.createdAt.toISOString()
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Kunden hittades inte')
      }
      throw error
    }
  }

  static async deleteCustomer(id: string): Promise<void> {
    try {
      await prisma.customer.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Kunden hittades inte')
      }
      throw error
    }
  }

  static async getDatabaseUrl(subdomain: string): Promise<string | null> {
    const customer = await this.getCustomerBySubdomain(subdomain)
    if (!customer) return null

    // Handle environment variable references
    if (customer.databaseUrl.startsWith('env:')) {
      const envVar = customer.databaseUrl.substring(4)
      return process.env[envVar] || null
    }

    return customer.databaseUrl
  }
}