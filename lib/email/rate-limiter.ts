/**
 * Email Rate Limiter
 * Ensures we don't exceed Resend's rate limit of 2 requests per second
 */
export class EmailRateLimiter {
  private static readonly REQUESTS_PER_SECOND = 2
  private static readonly DELAY_MS = 1000
  
  /**
   * Send items in batches with rate limiting
   * @param items Array of items to process
   * @param sendFunction Function to call for each item
   * @param onProgress Optional callback for progress updates
   * @returns Array of results from Promise.allSettled
   */
  static async sendBatch<T>(
    items: T[],
    sendFunction: (item: T) => Promise<any>,
    onProgress?: (sent: number, total: number, currentBatch: string[]) => void
  ): Promise<PromiseSettledResult<any>[]> {
    const results: PromiseSettledResult<any>[] = []
    
    for (let i = 0; i < items.length; i += this.REQUESTS_PER_SECOND) {
      const batch = items.slice(i, i + this.REQUESTS_PER_SECOND)
      
      // Extract names for progress display (if items have name property)
      const batchNames = batch.map((item: any) => {
        if (item.name) return item.name
        if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`
        return 'Unknown'
      })
      
      // Send batch
      const batchResults = await Promise.allSettled(
        batch.map(item => sendFunction(item))
      )
      
      results.push(...batchResults)
      
      // Report progress
      if (onProgress) {
        const sentCount = Math.min(i + batch.length, items.length)
        onProgress(sentCount, items.length, batchNames)
      }
      
      // Delay between batches (but not after the last batch)
      if (i + this.REQUESTS_PER_SECOND < items.length) {
        await new Promise(resolve => setTimeout(resolve, this.DELAY_MS))
      }
    }
    
    return results
  }
  
  /**
   * Calculate estimated time for sending emails
   * @param emailCount Number of emails to send
   * @returns Estimated time in seconds
   */
  static estimateTime(emailCount: number): number {
    if (emailCount <= this.REQUESTS_PER_SECOND) return 1
    
    const batches = Math.ceil(emailCount / this.REQUESTS_PER_SECOND)
    return batches // Each batch takes 1 second
  }
  
  /**
   * Determine processing mode based on volume
   */
  static getProcessingMode(emailCount: number): 'instant' | 'small' | 'medium' | 'large' {
    if (emailCount <= 10) return 'instant'
    if (emailCount <= 30) return 'small'
    if (emailCount <= 60) return 'medium'
    return 'large'
  }
}