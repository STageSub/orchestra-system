# API Routes Update Guide

## Summary
All API routes need to be updated to use the subdomain-aware Prisma client instead of the default one.

## Changes Required

### 1. Import Change
Replace:
```typescript
import { prisma } from '@/lib/prisma'
```

With:
```typescript
import { getPrismaForRequest } from '@/lib/prisma-subdomain'
```

### 2. Function Signature Change
Add `request: Request` parameter to GET functions that don't have it:
```typescript
// Before
export async function GET() {

// After
export async function GET(request: Request) {
```

### 3. Get Prisma Client
Add at the beginning of each function:
```typescript
const prisma = await getPrismaForRequest(request)
```

### 4. ID Generator Update
When using `generateUniqueId`, pass the prisma client:
```typescript
// Before
const id = await generateUniqueId('musician')

// After
const id = await generateUniqueId('musician', prisma)
```

## Files Updated So Far
- ✅ /app/api/musicians/route.ts
- ✅ /app/api/projects/route.ts
- ✅ /app/api/dashboard/stats/route.ts
- ✅ /app/api/instruments/route.ts

## Files Remaining (55)
All files in /app/api/ that import from '@/lib/prisma' need to be updated.

## Testing
After updating, test each endpoint to ensure:
1. The correct database is accessed based on subdomain
2. Data isolation is maintained
3. No errors occur

## Script to Find Remaining Files
```bash
grep -r "from '@/lib/prisma'" app/api/ | grep -v ".next" | cut -d: -f1 | sort | uniq
```