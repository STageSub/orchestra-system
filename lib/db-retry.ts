import { Prisma } from '@prisma/client'

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryableErrors?: string[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'P1001', // Can't reach database server
    'P1002', // Database server timeout
    'P2024', // Timed out fetching a new connection from pool
    'P2034', // Write conflict
  ]
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      )
      
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), ` +
        `retrying in ${delay}ms...`,
        error
      )
      
      await sleep(delay)
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return retryableErrors.includes(error.code)
  }
  
  // Also retry on generic connection errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    )
  }
  
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Transaction with retry
export async function withTransactionRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  prisma: any,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(
    () => prisma.$transaction(fn, {
      maxWait: 10000, // Maximum time to wait for a transaction slot
      timeout: 30000, // Maximum time for the transaction to complete
    }),
    {
      ...options,
      retryableErrors: [
        ...DEFAULT_OPTIONS.retryableErrors,
        'P2028', // Transaction API error
      ]
    }
  )
}

// Batch operations with retry and chunking
export async function batchWithRetry<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>,
  options: RetryOptions = {}
): Promise<void> {
  const chunks = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize))
  }
  
  for (const [index, chunk] of chunks.entries()) {
    try {
      await withRetry(() => operation(chunk), options)
      console.log(`Batch ${index + 1}/${chunks.length} completed successfully`)
    } catch (error) {
      console.error(`Batch ${index + 1}/${chunks.length} failed after retries:`, error)
      throw error
    }
  }
}

// Example usage wrapper for common operations
export const dbOperations = {
  async create<T>(model: any, data: any): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await withRetry(() => model.create({ data }))
      const duration = Date.now() - startTime
      if (duration > 1000) {
        console.warn(`Slow create operation: ${duration}ms`)
      }
      return result
    } catch (error) {
      console.error('Create operation failed:', error)
      throw error
    }
  },
  
  async update<T>(model: any, where: any, data: any): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await withRetry(() => model.update({ where, data }))
      const duration = Date.now() - startTime
      if (duration > 1000) {
        console.warn(`Slow update operation: ${duration}ms`)
      }
      return result
    } catch (error) {
      console.error('Update operation failed:', error)
      throw error
    }
  },
  
  async delete(model: any, where: any): Promise<void> {
    const startTime = Date.now()
    try {
      await withRetry(() => model.delete({ where }))
      const duration = Date.now() - startTime
      if (duration > 1000) {
        console.warn(`Slow delete operation: ${duration}ms`)
      }
    } catch (error) {
      console.error('Delete operation failed:', error)
      throw error
    }
  }
}