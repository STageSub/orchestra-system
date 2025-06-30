import { getLogStorage } from './log-storage'

// Initialize log storage on server startup
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Initializing server-side log storage...')
  getLogStorage()
  console.log('✅ Server-side log storage initialized')
}

export function ensureLogStorage() {
  if (process.env.NODE_ENV === 'development') {
    return getLogStorage()
  }
  return null
}