// Safari detection and utilities
export function isSafari(userAgent: string): boolean {
  // Check if it's Safari but not Chrome (Chrome includes "Safari" in its UA)
  return userAgent.includes('Safari') && !userAgent.includes('Chrome')
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || ''
}

// Safari-specific cookie handling delays
export const SAFARI_COOKIE_DELAY = 100 // ms

export async function safariCookieDelay(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side delay for Safari
    await new Promise(resolve => setTimeout(resolve, SAFARI_COOKIE_DELAY))
  }
}