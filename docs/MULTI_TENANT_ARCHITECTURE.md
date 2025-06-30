# 🏗️ Multi-Tenant Architecture Documentation

## Overview

StageSub uses a **hybrid multi-tenant architecture** that starts with a shared database and allows seamless migration to dedicated databases for enterprise customers. This approach provides the perfect balance between cost-efficiency and enterprise-grade security.

## Architecture Decision

### Chosen Approach: Shared Database with Migration Path

We start with a **shared database with row-level security** where all orchestras share the same database tables, isolated by `tenantId`. This allows:

- ✅ Fast time to market
- ✅ Cost-effective for small/medium orchestras  
- ✅ Easy maintenance and updates
- ✅ Seamless migration to dedicated databases when needed

### Migration Strategy

When orchestras grow or require enhanced security (typically Institution tier), we can migrate them to a dedicated database:

```
Shared Database → Export Data → Create Dedicated DB → Import Data → Update Config → Done!
```

## Database Schema

### Core Tenant Tables

```prisma
model Tenant {
  id                String    @id @default(cuid())
  name              String
  subdomain         String    @unique
  subscription      String    // 'small', 'medium', 'institution'
  
  // Subscription Limits
  maxMusicians      Int
  maxActiveProjects Int
  maxInstruments    Int
  
  // Branding & Customization
  customBranding    Json?     // {logo, primaryColor, fontFamily}
  emailDomain       String?   // For institution tier custom emails
  
  // Database Configuration
  databaseType      String    @default("shared") // 'shared' or 'dedicated'
  databaseUrl       String?   // Connection string for dedicated DB
  
  // Subscription Management
  trialEndsAt       DateTime?
  subscriptionEndsAt DateTime?
  isActive          Boolean   @default(true)
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  users             User[]
  musicians         Musician[]
  instruments       Instrument[]
  projects          Project[]
  emailTemplates    EmailTemplate[]
  usageStats        UsageStats[]
  auditLogs         AuditLog[]
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // Hashed with bcrypt
  firstName     String
  lastName      String
  role          String    // 'superadmin', 'admin', 'user'
  
  // Tenant Association
  tenantId      String?   // null for superadmin
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  
  // OAuth Providers
  googleId      String?   @unique
  appleId       String?   @unique
  
  // Metadata
  lastLogin     DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Tenant Isolation

All existing tables get updated with:

```prisma
tenantId String
tenant   Tenant @relation(fields: [tenantId], references: [id])

@@index([tenantId]) // For query performance
```

## Connection Management

### Database Connection Manager

```typescript
// lib/db/connection-manager.ts
import { PrismaClient } from '@prisma/client'
import { LRUCache } from 'lru-cache'

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private sharedClient: PrismaClient
  private dedicatedClients: LRUCache<string, PrismaClient>
  
  private constructor() {
    // Shared database connection
    this.sharedClient = new PrismaClient({
      datasources: {
        db: { url: process.env.SHARED_TENANT_DB_URL || process.env.DATABASE_URL }
      }
    })
    
    // Cache for dedicated connections (max 50)
    this.dedicatedClients = new LRUCache<string, PrismaClient>({
      max: 50,
      ttl: 1000 * 60 * 60, // 1 hour
      dispose: (client) => client.$disconnect()
    })
  }
  
  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }
  
  async getClient(tenantId: string): Promise<PrismaClient> {
    // Get tenant configuration from master database
    const tenant = await this.sharedClient.tenant.findUnique({
      where: { id: tenantId }
    })
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    
    // Return dedicated client if configured
    if (tenant.databaseType === 'dedicated' && tenant.databaseUrl) {
      if (!this.dedicatedClients.has(tenantId)) {
        const client = new PrismaClient({
          datasources: {
            db: { url: tenant.databaseUrl }
          }
        })
        this.dedicatedClients.set(tenantId, client)
      }
      return this.dedicatedClients.get(tenantId)!
    }
    
    // Return shared client with tenant context
    return this.sharedClient
  }
}
```

### Prisma Middleware for Tenant Isolation

```typescript
// lib/db/tenant-middleware.ts
import { Prisma } from '@prisma/client'

export function createTenantMiddleware(tenantId: string): Prisma.Middleware {
  return async (params, next) => {
    // Skip for User and Tenant models (master data)
    if (params.model === 'User' || params.model === 'Tenant') {
      return next(params)
    }
    
    // Add tenant filter to all queries
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args = params.args || {}
      params.args.where = { ...params.args.where, tenantId }
    }
    
    if (params.action === 'findMany') {
      params.args = params.args || {}
      params.args.where = { ...params.args.where, tenantId }
    }
    
    // Add tenantId to all creates
    if (params.action === 'create') {
      params.args = params.args || {}
      params.args.data = { ...params.args.data, tenantId }
    }
    
    // Add tenant filter to updates
    if (params.action === 'update') {
      params.args = params.args || {}
      params.args.where = { ...params.args.where, tenantId }
    }
    
    // Add tenant filter to deletes
    if (params.action === 'delete') {
      params.args = params.args || {}
      params.args.where = { ...params.args.where, tenantId }
    }
    
    return next(params)
  }
}
```

## Subdomain Routing

### Middleware for Subdomain Detection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain
  const subdomain = hostname
    .split('.')[0]
    .split(':')[0] // Remove port if present
  
  // Skip for main domain and www
  if (!subdomain || subdomain === 'www' || subdomain === 'stagesub') {
    return NextResponse.next()
  }
  
  // Skip for superadmin routes
  if (url.pathname.startsWith('/superadmin')) {
    return NextResponse.next()
  }
  
  // Add subdomain to headers for use in app
  const response = NextResponse.next()
  response.headers.set('x-tenant-subdomain', subdomain)
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Getting Tenant Context

```typescript
// lib/auth/get-tenant.ts
import { headers } from 'next/headers'
import { cache } from 'react'

export const getTenant = cache(async () => {
  const headersList = headers()
  const subdomain = headersList.get('x-tenant-subdomain')
  
  if (!subdomain) {
    return null
  }
  
  const db = DatabaseConnectionManager.getInstance()
  const tenant = await db.getClient('master').tenant.findUnique({
    where: { subdomain }
  })
  
  return tenant
})

// Use in server components
export default async function ProjectsPage() {
  const tenant = await getTenant()
  if (!tenant) {
    return <div>Tenant not found</div>
  }
  
  const db = await DatabaseConnectionManager.getInstance().getClient(tenant.id)
  const projects = await db.project.findMany()
  
  return <ProjectsList projects={projects} />
}
```

## ID Generation with Tenant Prefix

### Updated ID Generator

```typescript
// lib/id-generator.ts
export async function generateUniqueId(
  type: 'musician' | 'instrument' | 'project' | 'request',
  tenantId: string
): Promise<string> {
  const prefixes = {
    musician: 'MUS',
    instrument: 'INST',
    project: 'PROJ',
    request: 'REQ'
  }
  
  const prefix = prefixes[type]
  const tenantPrefix = tenantId.substring(0, 3).toUpperCase()
  
  // Format: TEN-MUS-001 (tenant prefix + type + number)
  const db = await DatabaseConnectionManager.getInstance().getClient(tenantId)
  
  // Get highest existing ID for this tenant and type
  const pattern = `${tenantPrefix}-${prefix}-%`
  const highest = await db.$queryRaw`
    SELECT MAX(id) as max_id
    FROM ${type}
    WHERE tenantId = ${tenantId}
    AND id LIKE ${pattern}
  `
  
  const nextNumber = highest ? parseInt(highest.split('-')[2]) + 1 : 1
  return `${tenantPrefix}-${prefix}-${nextNumber.toString().padStart(3, '0')}`
}
```

## Security Considerations

### 1. Data Isolation

- **Shared Database**: Prisma middleware ensures all queries are filtered by tenantId
- **Dedicated Database**: Physical isolation at database level
- **API Routes**: All routes must verify tenant context
- **File Storage**: Separate folders per tenant

### 2. Authentication Flow

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password, subdomain } = await request.json()
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  })
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return new Response('Invalid credentials', { status: 401 })
  }
  
  // Verify subdomain matches (unless superadmin)
  if (user.role !== 'superadmin' && user.tenant?.subdomain !== subdomain) {
    return new Response('Invalid tenant', { status: 403 })
  }
  
  // Create JWT with tenant context
  const token = await createToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role
  })
  
  return Response.json({ token, tenant: user.tenant })
}
```

### 3. Audit Logging

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String
  action    String   // 'create', 'update', 'delete', 'login', etc
  model     String   // Which table was affected
  recordId  String?  // ID of affected record
  changes   Json?    // What changed
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}
```

## Performance Optimization

### 1. Database Indexes

```prisma
// Add to all tenant-scoped models
@@index([tenantId])
@@index([tenantId, createdAt])
@@index([tenantId, isActive]) // Where applicable
```

### 2. Query Optimization

```typescript
// Use select to minimize data transfer
const musicians = await db.musician.findMany({
  where: { tenantId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true
  }
})
```

### 3. Caching Strategy

- Cache tenant configuration (1 hour)
- Cache user permissions (15 minutes)
- Cache usage statistics (5 minutes)

## Migration Tools

### Export Tenant Data

```typescript
export async function exportTenantData(tenantId: string) {
  const db = await DatabaseConnectionManager.getInstance().getClient(tenantId)
  
  const data = {
    musicians: await db.musician.findMany({ where: { tenantId } }),
    instruments: await db.instrument.findMany({ where: { tenantId } }),
    projects: await db.project.findMany({ 
      where: { tenantId },
      include: { needs: true, files: true }
    }),
    rankings: await db.ranking.findMany({
      where: { musician: { tenantId } },
      include: { rankingList: true }
    }),
    // ... export all tenant data
  }
  
  return data
}
```

### Import to Dedicated Database

```typescript
export async function importToDedicatedDb(databaseUrl: string, data: any) {
  const db = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  })
  
  await db.$transaction(async (tx) => {
    // Import in dependency order
    for (const musician of data.musicians) {
      await tx.musician.create({ data: musician })
    }
    
    for (const instrument of data.instruments) {
      await tx.instrument.create({ data: instrument })
    }
    
    // ... continue for all data
  })
  
  await db.$disconnect()
}
```

## Monitoring & Analytics

### Usage Tracking

```prisma
model UsageStats {
  id               String   @id @default(cuid())
  tenantId         String
  date             DateTime @db.Date
  musicianCount    Int
  activeProjects   Int
  requestsSent     Int
  storageUsedMB    Float
  
  tenant           Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, date])
}
```

### Daily Usage Job

```typescript
// Run daily at midnight
export async function updateUsageStats() {
  const tenants = await prisma.tenant.findMany({ where: { isActive: true } })
  
  for (const tenant of tenants) {
    const db = await DatabaseConnectionManager.getInstance().getClient(tenant.id)
    
    const stats = {
      tenantId: tenant.id,
      date: new Date(),
      musicianCount: await db.musician.count({ where: { tenantId: tenant.id } }),
      activeProjects: await db.project.count({ 
        where: { 
          tenantId: tenant.id,
          status: 'active' 
        } 
      }),
      // ... calculate other stats
    }
    
    await prisma.usageStats.upsert({
      where: { tenantId_date: { tenantId: tenant.id, date: stats.date } },
      create: stats,
      update: stats
    })
  }
}
```

## Deployment Considerations

### Environment Variables

```env
# Master database (contains tenant info) - Neon.tech
DATABASE_URL=postgresql://neondb_owner:[password]@ep-[project].gwc.azure.neon.tech/neondb?sslmode=require

# Shared tenant database - Neon.tech
SHARED_TENANT_DB_URL=postgresql://neondb_owner:[password]@ep-[project].gwc.azure.neon.tech/neondb?sslmode=require

# JWT Secret for auth
JWT_SECRET=...

# Superadmin credentials
SUPERADMIN_EMAIL=ceo@stagesub.com
SUPERADMIN_PASSWORD=...

# Domain configuration
APP_DOMAIN=stagesub.com
```

### DNS Configuration

- Wildcard subdomain: `*.stagesub.com` → Your app
- SSL certificate: Wildcard certificate for `*.stagesub.com`

## Best Practices

1. **Always use tenant context** - Never query without tenantId
2. **Validate tenant access** - Check user belongs to tenant
3. **Audit everything** - Log all admin actions
4. **Monitor usage** - Track against limits
5. **Test isolation** - Regular security audits
6. **Backup strategy** - Daily backups per tenant
7. **Clear data ownership** - Tenants own their data