export function isSafari(userAgent: string | null): boolean {
  if (!userAgent) return false
  
  // Check for Safari browser (but not Chrome, which includes Safari in UA)
  const isSafariBrowser = userAgent.includes('Safari') && !userAgent.includes('Chrome')
  
  // Also check for iOS devices which always use Safari engine
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)
  
  return isSafariBrowser || isIOS
}

export function getBrowserInfo(userAgent: string | null): {
  name: string
  isSafari: boolean
  isIOS: boolean
} {
  if (!userAgent) {
    return { name: 'Unknown', isSafari: false, isIOS: false }
  }
  
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return { name: 'Chrome', isSafari: false, isIOS }
  }
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return { name: 'Safari', isSafari: true, isIOS }
  }
  
  if (userAgent.includes('Firefox')) {
    return { name: 'Firefox', isSafari: false, isIOS }
  }
  
  if (userAgent.includes('Edg')) {
    return { name: 'Edge', isSafari: false, isIOS }
  }
  
  return { name: 'Other', isSafari: false, isIOS }
}