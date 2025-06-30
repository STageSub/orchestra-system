interface LogEntry {
  timestamp: Date
  level: 'error' | 'warn' | 'info' | 'log'
  message: string
  stack?: string
}

class LogStorage {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs
  private originalConsole: {
    error: typeof console.error
    warn: typeof console.warn
    log: typeof console.log
    info: typeof console.info
  }

  constructor() {
    // Store original console methods
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info
    }

    // Override console methods to capture logs
    this.interceptConsole()
  }

  private interceptConsole() {
    const self = this

    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      self.addLog('error', message)
      self.originalConsole.error(...args)
    }

    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      self.addLog('warn', message)
      self.originalConsole.warn(...args)
    }

    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      self.addLog('log', message)
      self.originalConsole.log(...args)
    }

    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      self.addLog('info', message)
      self.originalConsole.info(...args)
    }
  }

  private addLog(level: LogEntry['level'], message: string) {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      stack: level === 'error' ? new Error().stack : undefined
    }

    this.logs.push(logEntry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  public getLogs(filter?: string, since?: Date): LogEntry[] {
    let filteredLogs = this.logs

    if (since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp > since)
    }

    if (filter) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(filter.toLowerCase())
      )
    }

    return filteredLogs.slice(-100) // Return last 100 matching logs
  }

  public clearLogs() {
    this.logs = []
  }

  public getEmailLogs(since?: Date): LogEntry[] {
    return this.getLogs('🔥', since).concat(
      this.getLogs('email', since),
      this.getLogs('SEND', since),
      this.getLogs('confirmation', since)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }
}

// Global instance
let logStorage: LogStorage | null = null

export function getLogStorage(): LogStorage {
  if (!logStorage) {
    logStorage = new LogStorage()
    console.log('🔥 Log storage initialized at', new Date().toISOString())
  }
  return logStorage
}

// Initialize immediately if in development
if (process.env.NODE_ENV === 'development') {
  getLogStorage()
}

export type { LogEntry }