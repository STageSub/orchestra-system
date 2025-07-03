interface CreateProjectParams {
  name: string
  dbPass: string
  region?: string
}

interface SupabaseProject {
  id: string
  organization_id: string
  name: string
  region: string
  created_at: string
  database: {
    host: string
    port: number
    user: string
    database: string
  }
  status: 'ACTIVE_HEALTHY' | 'INACTIVE' | 'PROVISIONING' | 'RESTORING'
}

export class SupabaseManagementService {
  private baseUrl = 'https://api.supabase.com'
  private token: string
  private organizationId: string

  constructor() {
    const token = process.env.SUPABASE_MANAGEMENT_TOKEN
    const orgId = process.env.SUPABASE_ORGANIZATION_ID

    if (!token) {
      throw new Error('SUPABASE_MANAGEMENT_TOKEN is not configured')
    }
    if (!orgId) {
      throw new Error('SUPABASE_ORGANIZATION_ID is not configured')
    }

    this.token = token
    this.organizationId = orgId
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Supabase API error: ${response.status} - ${error}`)
    }

    return response
  }

  async createProject(params: CreateProjectParams): Promise<SupabaseProject> {
    console.log(`Creating new Supabase project: ${params.name}`)
    
    const response = await this.makeRequest('/v1/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        organization_id: this.organizationId,
        db_pass: params.dbPass,
        region: params.region || 'eu-north-1', // Default to Stockholm region
      }),
    })

    const project = await response.json()
    console.log(`Project created with ID: ${project.id}`)
    
    return project
  }

  async getProject(projectId: string): Promise<SupabaseProject> {
    const response = await this.makeRequest(`/v1/projects/${projectId}`)
    return response.json()
  }

  async waitForProjectReady(
    projectId: string,
    maxWaitTime = 600000 // 10 minutes
  ): Promise<SupabaseProject> {
    console.log(`Waiting for project ${projectId} to become active...`)
    
    const startTime = Date.now()
    const pollInterval = 5000 // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const project = await this.getProject(projectId)
      
      if (project.status === 'ACTIVE_HEALTHY') {
        console.log(`Project ${projectId} is now active!`)
        return project
      }
      
      console.log(`Project status: ${project.status}, waiting...`)
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Project ${projectId} did not become active within ${maxWaitTime}ms`)
  }

  async getConnectionString(projectId: string, password: string): Promise<string> {
    const project = await this.getProject(projectId)
    
    if (!project.database) {
      throw new Error('Project database information not available')
    }

    const { host, user, database } = project.database
    
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(password)
    
    // Construct pooler connection string for production use
    // Use the host from the project and transform it to pooler format
    const poolerHost = host.replace('db.', '').replace('.supabase.co', '.pooler.supabase.com')
    const poolerPort = 6543
    const poolerUser = `postgres.${projectId}`
    
    // For EU regions, use the correct AWS region
    const regionMatch = host.match(/db\.([a-z0-9]+)\.supabase\.co/)
    if (regionMatch) {
      const projectRef = regionMatch[1]
      const connectionString = `postgresql://${poolerUser}:${encodedPassword}@aws-0-eu-north-1.pooler.supabase.com:${poolerPort}/postgres?pgbouncer=true`
      console.log('Using pooler connection:', connectionString.replace(encodedPassword, '***'))
      return connectionString
    }
    
    const connectionString = `postgresql://${poolerUser}:${encodedPassword}@${poolerHost}:${poolerPort}/${database}?pgbouncer=true`
    
    return connectionString
  }

  async getDirectConnectionString(projectId: string, password: string): Promise<string> {
    const project = await this.getProject(projectId)
    
    if (!project.database) {
      throw new Error('Project database information not available')
    }

    const { host, user, database } = project.database
    
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(password)
    
    // Direct connection for migrations
    // Direct connection uses port 5432 and projectId in username
    const directPort = 5432
    const directUser = `postgres.${projectId}`
    
    const connectionString = `postgresql://${directUser}:${encodedPassword}@db.${projectId}.supabase.co:${directPort}/${database}`
    
    return connectionString
  }

  generateSecurePassword(): string {
    // Generate a secure random password
    // Avoid characters that might cause URL encoding issues
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const specialChars = '!#$%*+-=?_'
    let password = ''
    
    // Ensure password has mix of character types
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Add some special characters
    for (let i = 0; i < 8; i++) {
      password += specialChars.charAt(Math.floor(Math.random() * specialChars.length))
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

// Singleton instance
let managementService: SupabaseManagementService | null = null

export function getSupabaseManagement(): SupabaseManagementService {
  if (!managementService) {
    managementService = new SupabaseManagementService()
  }
  return managementService
}