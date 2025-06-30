import { prisma } from './prisma'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  error?: string
  timestamp: Date
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`
    
    const latency = Date.now() - startTime
    
    // Warn if latency is high
    if (latency > 1000) {
      console.warn(`Database latency is high: ${latency}ms`)
      return {
        status: 'degraded',
        latency,
        timestamp: new Date()
      }
    }
    
    return {
      status: 'healthy',
      latency,
      timestamp: new Date()
    }
  } catch (error) {
    const latency = Date.now() - startTime
    console.error('Database health check failed:', error)
    
    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }
  }
}

// Monitor database health periodically
let healthCheckInterval: NodeJS.Timeout | null = null

export function startHealthMonitoring(intervalMs: number = 30000) {
  if (healthCheckInterval) {
    console.log('Health monitoring already running')
    return
  }
  
  console.log(`Starting database health monitoring (every ${intervalMs}ms)`)
  
  // Initial check
  checkDatabaseHealth().then(result => {
    console.log('Initial database health:', result)
  })
  
  // Periodic checks
  healthCheckInterval = setInterval(async () => {
    const result = await checkDatabaseHealth()
    
    if (result.status === 'unhealthy') {
      console.error('DATABASE UNHEALTHY:', result)
      // Here you could trigger alerts, send emails, etc.
    } else if (result.status === 'degraded') {
      console.warn('Database performance degraded:', result)
    }
  }, intervalMs)
}

export function stopHealthMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
    console.log('Stopped database health monitoring')
  }
}

// Connection pool stats (Supabase specific)
export async function getConnectionStats() {
  try {
    const stats = await prisma.$queryRaw<Array<{
      state: string
      count: bigint
    }>>`
      SELECT state, count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `
    
    return stats.map(s => ({
      state: s.state,
      count: Number(s.count)
    }))
  } catch (error) {
    console.error('Failed to get connection stats:', error)
    return []
  }
}

// Log slow queries
export function logSlowQuery(queryName: string, duration: number, threshold: number = 1000) {
  if (duration > threshold) {
    console.warn(`SLOW QUERY [${queryName}]: ${duration}ms`)
    
    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToMonitoring({ type: 'slow_query', name: queryName, duration })
    }
  }
}