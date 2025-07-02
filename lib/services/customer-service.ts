import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

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

const CONFIG_FILE = join(process.cwd(), 'customer-config.json')

// In-memory cache for performance
let cachedConfig: CustomerConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

export class CustomerService {
  private static async loadConfig(): Promise<CustomerConfig> {
    const now = Date.now()
    
    // Return cached config if still valid
    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
      return cachedConfig
    }

    try {
      const data = await readFile(CONFIG_FILE, 'utf-8')
      cachedConfig = JSON.parse(data)
      cacheTimestamp = now
      return cachedConfig!
    } catch (error) {
      console.error('Failed to load customer config:', error)
      // Return empty config as fallback
      return { customers: [] }
    }
  }

  private static async saveConfig(config: CustomerConfig): Promise<void> {
    try {
      await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
      // Update cache
      cachedConfig = config
      cacheTimestamp = Date.now()
    } catch (error) {
      console.error('Failed to save customer config:', error)
      throw new Error('Kunde inte spara kundkonfiguration')
    }
  }

  static async getCustomers(): Promise<Customer[]> {
    const config = await this.loadConfig()
    return config.customers.filter(c => c.status === 'active')
  }

  static async getAllCustomers(): Promise<Customer[]> {
    const config = await this.loadConfig()
    return config.customers
  }

  static async getCustomerBySubdomain(subdomain: string): Promise<Customer | null> {
    const config = await this.loadConfig()
    return config.customers.find(c => c.subdomain === subdomain) || null
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const config = await this.loadConfig()
    return config.customers.find(c => c.id === id) || null
  }

  static async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const config = await this.loadConfig()
    
    // Check if subdomain already exists
    if (config.customers.some(c => c.subdomain === customer.subdomain)) {
      throw new Error('Subdomänen finns redan')
    }

    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    config.customers.push(newCustomer)
    await this.saveConfig(config)
    
    return newCustomer
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const config = await this.loadConfig()
    const index = config.customers.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error('Kunden hittades inte')
    }

    // Don't allow changing id or createdAt
    delete updates.id
    delete updates.createdAt

    // Check subdomain uniqueness if being changed
    if (updates.subdomain && updates.subdomain !== config.customers[index].subdomain) {
      if (config.customers.some(c => c.subdomain === updates.subdomain)) {
        throw new Error('Subdomänen finns redan')
      }
    }

    config.customers[index] = {
      ...config.customers[index],
      ...updates
    }

    await this.saveConfig(config)
    return config.customers[index]
  }

  static async deleteCustomer(id: string): Promise<void> {
    const config = await this.loadConfig()
    const index = config.customers.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error('Kunden hittades inte')
    }

    config.customers.splice(index, 1)
    await this.saveConfig(config)
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

  // Clear cache if needed (e.g., after direct file modification)
  static clearCache(): void {
    cachedConfig = null
    cacheTimestamp = 0
  }
}