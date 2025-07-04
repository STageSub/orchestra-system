import { neonPrisma } from '@/lib/prisma-dynamic'
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
    context?: LogContext
  ) {
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

    // Store in database
    try {
      await neonPrisma.systemLog.create({
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
    } catch (error) {
      // Fallback to console if database write fails
      console.error('Failed to write log to database:', error)
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
  debug(category: LogCategory, message: string, context?: LogContext) {
    return this.log('debug', category, message, context)
  }

  info(category: LogCategory, message: string, context?: LogContext) {
    return this.log('info', category, message, context)
  }

  warn(category: LogCategory, message: string, context?: LogContext) {
    return this.log('warn', category, message, context)
  }

  error(category: LogCategory, message: string, context?: LogContext) {
    return this.log('error', category, message, context)
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
    orchestraId
  } = options

  const where: any = {}

  if (category) where.category = category
  if (level) where.level = level
  if (userId) where.userId = userId
  if (orchestraId) where.orchestraId = orchestraId

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
    neonPrisma.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    }),
    neonPrisma.systemLog.count({ where })
  ])

  return { logs, total }
}

// Helper to clean old logs
export async function cleanOldLogs(daysToKeep: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await neonPrisma.systemLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}