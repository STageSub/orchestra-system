# 🚀 Supabase Optimization Guide

## Overview

This document explains the optimizations implemented to prevent database save issues that were experienced with Neon.tech.

## Implemented Optimizations

### 1. Enhanced Prisma Client Configuration

**File**: `/lib/prisma.ts`

- Singleton pattern to prevent multiple connections
- Graceful shutdown handling
- Better error formatting
- Optimized datasource configuration

### 2. Database Health Monitoring

**File**: `/lib/db-health.ts`

Features:
- Real-time latency monitoring
- Connection pool statistics
- Automatic health checks every 30 seconds
- Alerts for degraded performance (>1000ms latency)

Usage:
```typescript
import { checkDatabaseHealth, startHealthMonitoring } from '@/lib/db-health'

// One-time check
const health = await checkDatabaseHealth()

// Start continuous monitoring
startHealthMonitoring(30000) // Check every 30 seconds
```

### 3. Retry Logic for Database Operations

**File**: `/lib/db-retry.ts`

Features:
- Automatic retry on transient failures
- Exponential backoff (100ms → 200ms → 400ms → etc.)
- Configurable retry policies
- Transaction-specific retry handling

Usage:
```typescript
import { withRetry, withTransactionRetry, dbOperations } from '@/lib/db-retry'

// Simple retry
const result = await withRetry(() => 
  prisma.musician.create({ data: musicianData })
)

// Transaction with retry
const result = await withTransactionRetry(async (tx) => {
  await tx.musician.create({ data: musicianData })
  await tx.ranking.create({ data: rankingData })
}, prisma)

// Using helper operations
const musician = await dbOperations.create(prisma.musician, musicianData)
```

### 4. Enhanced Health Check Endpoint

**Endpoint**: `/api/health`

New features:
- Database latency measurement
- Connection pool statistics
- Basic application statistics
- Provider identification (supabase)

## Common Issues Resolved

### 1. Connection Timeouts
- **Problem**: Neon.tech had 300-900ms latency causing timeouts
- **Solution**: Supabase has 50-100ms latency + retry logic for edge cases

### 2. Connection Pool Exhaustion
- **Problem**: Too many concurrent connections
- **Solution**: Singleton pattern + connection pool monitoring

### 3. Transaction Failures
- **Problem**: Write conflicts and deadlocks
- **Solution**: Transaction-specific retry with proper error handling

### 4. Silent Failures
- **Problem**: Operations failing without proper error messages
- **Solution**: Enhanced error logging and monitoring

## Monitoring Commands

### Check Database Health
```bash
curl http://localhost:3000/api/health | jq
```

### View Connection Pool Status
```sql
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = current_database() 
GROUP BY state;
```

### Monitor Slow Queries
Check console logs for warnings about queries >1000ms

## Best Practices

### 1. Use Retry Wrapper for Critical Operations
```typescript
// Instead of:
await prisma.musician.create({ data })

// Use:
await withRetry(() => prisma.musician.create({ data }))
```

### 2. Monitor Transaction Size
Keep transactions small and focused to avoid conflicts

### 3. Use Batch Operations Wisely
```typescript
// Use batchWithRetry for large operations
await batchWithRetry(items, 100, async (batch) => {
  await prisma.musician.createMany({ data: batch })
})
```

### 4. Enable Health Monitoring in Production
Add to your app initialization:
```typescript
if (process.env.NODE_ENV === 'production') {
  startHealthMonitoring(60000) // Check every minute
}
```

## Performance Benchmarks

### Supabase (Current)
- Connection: 50-100ms
- Simple queries: 20-50ms
- Complex queries: 50-200ms
- Transactions: 100-300ms

### Neon.tech (Previous)
- Connection: 300-900ms
- Simple queries: 100-300ms
- Complex queries: 300-1000ms
- Transactions: 500-2000ms

## Troubleshooting

### If Save Operations Fail

1. Check health endpoint for database status
2. Look for retry warnings in console
3. Verify connection pool isn't exhausted
4. Check for specific Prisma error codes

### Error Codes to Watch

- `P1001`: Can't reach database (network issue)
- `P1002`: Database timeout
- `P2024`: Connection pool timeout
- `P2034`: Write conflict (retry usually helps)

## Future Improvements

1. **Connection Pooling**: Consider pgBouncer for even better connection management
2. **Read Replicas**: Use Supabase read replicas for query load distribution
3. **Caching**: Implement Redis for frequently accessed data
4. **Query Optimization**: Add database indexes for slow queries