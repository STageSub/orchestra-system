'use client'

import { useEffect } from 'react'

export function LogInitializer() {
  useEffect(() => {
    // Initialize log storage on client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('@/lib/log-storage').then(({ getLogStorage }) => {
        getLogStorage() // This initializes the log storage and console interception
        console.log('🔥 Log storage initialized')
      })
    }
  }, [])

  return null // This component doesn't render anything
}