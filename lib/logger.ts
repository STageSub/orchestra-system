import { neonPrisma } from '@/lib/prisma-dynamic'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { NextRequest } from 'next/server'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 'system' | 'auth' | 'email' | 'request' | 'test' | 'error' | 'api'

interface LogContext {
  userId?: string
  orchestraId?: string
  subdomain?: string
  ip?: string
  userAgent?: string
  requestId?: string
  duration?: number
  metadata?: any
}

class Logger {
  private static instance: Logger
  private inMemoryLogs: any[] = []
  private maxInMemoryLogs = 1000

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    request?: NextRequest
  ) {
    try {
      const logEntry = {
        timestamp: new Date(),
        level,
        category,
        message,
        ...context
      }

      // Always log to console in development
      if (process.env.NODE_ENV !== 'production') {
        const color = this.getConsoleColor(level)
        console.log(
          `${color}[${level.toUpperCase()}]${this.resetColor()} [${category}] ${message}`,
          context?.metadata || ''
        )
      }

      // Store in memory for development
      this.addToMemory(logEntry)

      // Store in database - make this fire-and-forget to prevent blocking
      // Determine which database to write to based on user's orchestra
      (async () => {
        try {
          let prisma
          
          // If request is provided, use getPrismaForUser to get the correct database
          if (request) {
            prisma = await getPrismaForUser(request)
          } else {
            // Fallback to central database for system logs without user context
            prisma = neonPrisma
          }
          
          await prisma.systemLog.create({
            data: {
              level,
              category,
              message,
              metadata: context?.metadata ? JSON.parse(JSON.stringify(context.metadata)) : undefined,
              userId: context?.userId,
              orchestraId: context?.orchestraId,
              subdomain: context?.subdomain,
              ip: context?.ip,
              userAgent: context?.userAgent,
              requestId: context?.requestId,
              duration: context?.duration
            }
          })
        } catch (dbError) {
          // Only log to console if database write fails, don't throw
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to write log to database:', dbError)
          }
        }
      })()
    } catch (error) {
      // Catch any errors in the entire logging process
      // This prevents logger from ever throwing and breaking the app
      console.error('Logger error (non-blocking):', error)
    }
  }

  private addToMemory(log: any) {
    this.inMemoryLogs.unshift(log)
    if (this.inMemoryLogs.length > this.maxInMemoryLogs) {
      this.inMemoryLogs.pop()
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '\x1b[36m' // Cyan
      case 'info': return '\x1b[32m'  // Green
      case 'warn': return '\x1b[33m'  // Yellow
      case 'error': return '\x1b[31m' // Red
      default: return '\x1b[0m'
    }
  }

  private resetColor(): string {
    return '\x1b[0m'
  }

  // Convenience methods
  debug(category: LogCategory, message: string, context?: LogContext, request?: NextRequest) {
    return this.log('debug', category, message, context, request)
  }

  info(category: LogCategory, message: string, context?: LogContext, request?: NextRequest) {
    return this.log('info', category, message, context, request)
  }

  warn(category: LogCategory, message: string, context?: LogContext, request?: NextRequest) {
    return this.log('warn', category, message, context, request)
  }

  error(category: LogCategory, message: string, context?: LogContext, request?: NextRequest) {
    return this.log('error', category, message, context, request)
  }

  // Get logs from memory (for development)
  getInMemoryLogs(limit: number = 100): any[] {
    return this.inMemoryLogs.slice(0, limit)
  }

  // Extract context from request
  extractRequestContext(request: NextRequest): Partial<LogContext> {
    return {
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      requestId: request.headers.get('x-request-id') || undefined
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Helper function for API routes to log with request context
export function logWithRequest(
  request: NextRequest,
  level: LogLevel,
  category: LogCategory,
  message: string,
  additionalContext?: Partial<LogContext>
) {
  const context: LogContext = {
    ...logger.extractRequestContext(request),
    ...additionalContext
  }
  
  return logger.log(level, category, message, context, request)
}

// Convenience object for API routes
export const apiLogger = {
  info: (request: NextRequest, category: LogCategory, message: string, context?: Partial<LogContext>) =>
    logWithRequest(request, 'info', category, message, context),
  error: (request: NextRequest, category: LogCategory, message: string, context?: Partial<LogContext>) =>
    logWithRequest(request, 'error', category, message, context),
  warn: (request: NextRequest, category: LogCategory, message: string, context?: Partial<LogContext>) =>
    logWithRequest(request, 'warn', category, message, context),
  debug: (request: NextRequest, category: LogCategory, message: string, context?: Partial<LogContext>) =>
    logWithRequest(request, 'debug', category, message, context)
}

// Helper function to get logs from database
export async function getSystemLogs(options: {
  limit?: number
  offset?: number
  category?: LogCategory
  level?: LogLevel
  startDate?: Date
  endDate?: Date
  search?: string
  userId?: string
  orchestraId?: string
  request?: NextRequest
}) {
  const {
    limit = 50,
    offset = 0,
    category,
    level,
    startDate,
    endDate,
    search,
    userId,
    orchestraId,
    request
  } = options

  // Get the correct prisma instance for the orchestra
  let prisma
  if (request) {
    // Use the same logic as writing - get database based on user's orchestra
    prisma = await getPrismaForUser(request)
  } else {
    // Fallback to central database
    prisma = neonPrisma
  }

  const where: any = {}

  if (category) where.category = category
  if (level) where.level = level
  if (userId) where.userId = userId
  // Remove orchestraId filter - each database only has its own logs

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  if (search) {
    where.OR = [
      { message: { contains: search, mode: 'insensitive' } },
      { metadata: { string_contains: search } }
    ]
  }

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.systemLog.count({ where })
  ])

  return { logs, total }
}

// Helper to clean old logs
export async function cleanOldLogs(daysToKeep: number = 30, request?: NextRequest) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  // Get the correct prisma instance
  let prisma
  if (request) {
    prisma = await getPrismaForUser(request)
  } else {
    prisma = neonPrisma
  }

  const result = await prisma.systemLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}