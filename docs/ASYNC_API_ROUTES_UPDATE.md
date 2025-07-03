# Async API Routes Update - Progress Report

## What Was Done

### 1. Middleware Fix
Updated middleware to properly pass subdomain in request headers:
```typescript
const requestHeaders = new Headers(request.headers)
requestHeaders.set('x-subdomain', subdomain)

const response = NextResponse.next({
  request: {
    headers: requestHeaders,
  }
})
```

### 2. Helper Functions Updated
- `getPrismaFromHeaders()` - Already async ✅
- `getPrismaFromRequest()` - Made async ✅
- Added new `getPrismaForRequest()` for standard Request objects

### 3. ID Generator Updated
Updated to accept optional prisma parameter:
```typescript
export async function generateUniqueId(entityType: EntityType, prisma?: PrismaClient)
export async function peekNextId(entityType: EntityType, prisma?: PrismaClient)
export async function isIdUsed(entityType: EntityType, id: string, prisma?: PrismaClient)
```

### 4. API Routes Updated (6/59)
- ✅ /app/api/musicians/route.ts
- ✅ /app/api/projects/route.ts
- ✅ /app/api/dashboard/stats/route.ts
- ✅ /app/api/instruments/route.ts
- ✅ /app/api/templates/route.ts

## Pattern for Updating Routes

### Step 1: Update Import
```typescript
// From
import { prisma } from '@/lib/prisma'

// To
import { getPrismaForRequest } from '@/lib/prisma-subdomain'
```

### Step 2: Update Function Signature
```typescript
// From
export async function GET() {

// To
export async function GET(request: Request) {
```

### Step 3: Get Prisma Client
```typescript
const prisma = await getPrismaForRequest(request)
```

### Step 4: Update generateUniqueId calls
```typescript
// From
const id = await generateUniqueId('musician')

// To
const id = await generateUniqueId('musician', prisma)
```

## Special Cases

### 1. Respond Route (/api/respond)
This route is accessed by musicians from emails and may come from different subdomains. It uses tokens that should be unique across all databases. Need special handling.

### 2. Superadmin Routes
These routes may need to access multiple databases and should not use subdomain-based routing.

### 3. Test Routes
These are development-only routes and may need special consideration.

## Remaining Work

53 more API routes need to be updated. The pattern is straightforward but repetitive. Each route needs:
1. Import change
2. Function signature update (if needed)
3. Get prisma client at start
4. Pass prisma to generateUniqueId (if used)

## Testing Strategy

After updating all routes:
1. Test basic CRUD operations for each entity
2. Test subdomain routing (e.g., goteborg.localhost:3000)
3. Verify data isolation between subdomains
4. Test ID generation with correct database

## Next Steps

1. Continue updating remaining API routes
2. Create automated test for subdomain routing
3. Document any special cases found
4. Update error handling for database connection issues