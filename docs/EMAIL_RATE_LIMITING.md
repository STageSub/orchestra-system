# Email Rate Limiting Implementation

## Overview

The Orchestra System implements comprehensive rate limiting for all email sending operations to prevent Resend API 429 "Too Many Requests" errors. The system enforces a limit of 2 requests per second with intelligent batching and real-time progress feedback.

## Problem Solved

- **Issue**: Resend API has a rate limit of 2 requests per second
- **Symptom**: 429 errors when sending multiple emails quickly (e.g., "först till kvarn" strategy sending to 50+ musicians)
- **Solution**: Batch processing with delays and visual progress feedback

## Architecture

### Core Components

#### 1. EmailRateLimiter (`/lib/email/rate-limiter.ts`)
```typescript
export class EmailRateLimiter {
  private static readonly REQUESTS_PER_SECOND = 2
  private static readonly DELAY_MS = 1000
  
  // Main batch sending method
  static async sendBatch<T>(
    items: T[],
    sendFunction: (item: T) => Promise<any>,
    onProgress?: (sent: number, total: number, currentBatch: string[]) => void
  ): Promise<PromiseSettledResult<any>[]>
}
```

**Features:**
- Processes emails in batches of 2 per second
- Provides progress callbacks for UI updates
- Returns Promise.allSettled results for error handling
- Supports any email type (generic implementation)

#### 2. Progress Tracking API (`/app/api/projects/[id]/send-progress/route.ts`)
- In-memory storage with session-based tracking
- Automatic cleanup after 5 minutes
- RESTful endpoint for polling progress
- Exports `updateSendProgress` function for internal use

#### 3. Progress Modal UI (`/components/email-send-progress-modal-v2.tsx`)
Visual feedback component with different modes based on volume:

| Volume | Mode | UI |
|--------|------|-----|
| 1-10 emails | Instant | Simple spinner |
| 11-30 emails | Small | Progress bar with recipient names |
| 31-60 emails | Medium | Progress bar + background option |
| 60+ emails | Large | Automatic background processing |

## Implementation Details

### Email Sending Flow

1. **Volume Detection**
   ```typescript
   // Get preview to determine email count
   const previewResponse = await fetch(`/api/projects/${projectId}/preview-requests`)
   const totalEmails = previewData.totalToSend
   ```

2. **Session Creation**
   ```typescript
   const sessionId = `send-${Date.now()}`
   ```

3. **Progress Modal Display**
   ```typescript
   if (totalEmails > 10) {
     setShowProgressModal(true)
   }
   ```

4. **Batch Processing**
   ```typescript
   await EmailRateLimiter.sendBatch(
     recipients,
     async (recipient) => sendEmail(recipient),
     (sent, total, currentBatch) => {
       updateSendProgress(projectId, sessionId, {
         sent, total, currentBatch,
         estimatedTime: Math.ceil((total - sent) / 2)
       })
     }
   )
   ```

### Integration Points

#### 1. Project-wide Requests ("Skicka alla förfrågningar")
- **File**: `/lib/recipient-selection.ts` - `getRecipientsForProject()`
- **Progress**: Full support with session tracking
- **UI**: Shows modal for > 10 emails

#### 2. Individual Need Requests ("Skicka" on specific position)
- **File**: `/lib/recipient-selection.ts` - `getRecipientsForNeed()`
- **Progress**: Full support with callbacks
- **UI**: Shows modal for > 10 emails

#### 3. Group Emails
- **File**: `/app/api/group-email/send/route.ts`
- **Progress**: Console logging only
- **UI**: No modal (typically smaller volumes)

### Progress Data Structure

```typescript
interface ProgressData {
  total: number           // Total emails to send
  sent: number           // Emails sent so far
  currentBatch: string[] // Names being processed
  estimatedTime: number  // Seconds remaining
  status: 'sending' | 'completed' | 'error' | 'idle'
  error?: string         // Error message if failed
}
```

## Usage Examples

### Sending Requests for a Single Need

```typescript
// In handleConfirmSendRequests
const sessionId = `send-${Date.now()}`

const result = await getRecipientsForNeed(needId, {
  dryRun: false,
  sessionId,
  onProgress: (projectId, data) => {
    updateSendProgress(projectId, sessionId, data)
  }
}, prisma)
```

### Sending All Project Requests

```typescript
// In confirmSendRequests
const response = await fetch(`/api/projects/${projectId}/send-requests`, {
  method: 'POST',
  body: JSON.stringify({ sessionId })
})
```

### Client-side Progress Polling

```typescript
// In EmailSendProgressModal
useEffect(() => {
  const fetchProgress = async () => {
    const response = await fetch(
      `/api/projects/${projectId}/send-progress?sessionId=${sessionId}`
    )
    const data = await response.json()
    setProgress(data)
  }
  
  const interval = setInterval(fetchProgress, 500)
  return () => clearInterval(interval)
}, [projectId, sessionId])
```

## Error Handling

### Rate Limit Prevention
- Emails are sent with 500ms delay between batches
- Maximum 2 emails per second
- No possibility of hitting Resend's rate limit

### Failure Recovery
- Uses Promise.allSettled to continue on individual failures
- Failed emails are logged but don't stop the batch
- Progress modal shows error state if entire batch fails

### Timeout Protection
- 5-minute auto-cleanup for progress data
- Polling stops on completion or error
- Modal can be closed even during sending (background processing)

## Performance Considerations

### Timing Estimates
- Small batch (1-10): ~5 seconds
- Medium batch (11-30): ~15 seconds  
- Large batch (31-60): ~30 seconds
- Extra large (60+): Background processing recommended

### Memory Usage
- Progress data stored in memory (not database)
- Automatic cleanup prevents memory leaks
- Session-based isolation prevents conflicts

## Future Enhancements

### Planned Features
1. **Background Job Queue**
   - Redis/BullMQ integration for large volumes
   - Persistent progress tracking
   - Retry mechanisms

2. **Real-time Updates**
   - WebSocket/SSE for instant progress
   - Eliminate polling overhead

3. **Batch Optimization**
   - Dynamic batch sizing based on response times
   - Parallel processing for different projects

### Configuration Options
```typescript
// Potential future config
{
  rateLimit: {
    requestsPerSecond: 2,
    batchSize: 2,
    delayMs: 1000,
    progressThreshold: 10,
    backgroundThreshold: 60
  }
}
```

## Troubleshooting

### Common Issues

1. **Progress modal not showing**
   - Check if email volume > 10
   - Verify sessionId is being passed
   - Ensure progress endpoint is accessible

2. **Emails sending too slowly**
   - This is by design (2/second limit)
   - Consider background processing for large volumes

3. **Progress stuck at certain percentage**
   - Check server logs for email failures
   - Verify Resend API key is valid
   - Check for network issues

### Debug Logging
Enable detailed logging:
```typescript
console.log(`📧 Sending requests: ${sent}/${total}`)
console.log(`Current batch: ${currentBatch.join(', ')}`)
```

## Related Documentation

- [Email System Overview](./EMAIL_SYSTEM.md)
- [Request Strategies](./REQUEST_STRATEGIES.md)
- [API Documentation](./API_ENDPOINTS.md)