# SaaS Architecture Documentation

## Overview
This document describes the multi-tenant SaaS architecture implemented in the Orchestra System.

## Architecture Components

### 1. Database Schema

#### Tenant Model
```prisma
model Tenant {
  id                String    @id @default(cuid())
  name              String
  subdomain         String    @unique
  subscription      String    @default("trial")
  maxMusicians      Int
  maxActiveProjects Int
  maxInstruments    Int
  databaseType      String    @default("shared")
  databaseUrl       String?   // For dedicated databases
  // ... additional fields
}
```

#### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  role      String   @default("admin")
  tenantId  String?
  tenant    Tenant?  @relation(...)
}
```

### 2. Authentication System

#### Edge-Compatible Auth (`/lib/auth-edge.ts`)
Used in middleware and Edge Runtime environments:
- `createToken(userId, tenantId, role)` - Creates JWT with tenant info
- `verifyToken(token)` - Validates JWT
- `getAuthCookie()` - Retrieves auth cookie
- `setAuthCookie(token)` - Sets auth cookie
- `removeAuthCookie()` - Clears auth cookie
- `isAuthenticated()` - Checks auth status
- `verifyPassword(password)` - Legacy password verification

#### Node.js Auth (`/lib/auth-node.ts`)
Used in API routes requiring database access:
- `authenticateUser(email, password, tenantId?)` - Multi-tenant authentication
- `hashPassword(password)` - Bcrypt password hashing

#### Auth Barrel Export (`/lib/auth.ts`)
Re-exports from both files for backward compatibility.

### 3. Tenant Context Management

#### Tenant Context (`/lib/tenant-context.ts`)
- `runWithTenant(tenantId, callback)` - Executes code with tenant context
- `getCurrentTenant()` - Gets current tenant ID from AsyncLocalStorage
- `getTenantFromRequest(request)` - Extracts tenant from subdomain or headers

#### Middleware (`/middleware.ts`)
- Extracts tenant ID from subdomain
- Adds `x-tenant-id` header to all requests
- Verifies authentication for admin routes
- Adds `x-user-id` header for authenticated requests

### 4. Multi-Tenant Prisma Client

#### Prisma Middleware (`/lib/prisma-multitenant.ts`)
Automatically filters all queries by tenantId:
- Adds `tenantId` to WHERE clauses
- Adds `tenantId` to CREATE operations
- Skips filtering for User and Tenant models
- Handles child models through parent relations

### 5. Database Connection Manager

#### Connection Manager (`/lib/database-connection-manager.ts`)
Manages connections for both shared and dedicated databases:
- `getConnection(tenantId)` - Returns appropriate Prisma client
- `closeConnection(tenantId)` - Closes dedicated connection
- `closeAllConnections()` - Cleanup on shutdown
- Caches dedicated database connections

### 6. ID Generation

#### Multi-Tenant IDs (`/lib/id-generator-multitenant.ts`)
Format: `TENANT-ENTITY-NUMBER` (e.g., `GOT-MUS-001`)
- `generateUniqueId(entityType, tenantId?)` - Creates tenant-prefixed ID
- `peekNextId(entityType, tenantId?)` - Preview next ID
- `isIdUsed(entityType, id, tenantId?)` - Check ID existence
- `parseMultitenantId(id)` - Extract components from ID

### 7. API Structure

#### Superadmin Routes (`/app/superadmin/*`)
- `/superadmin` - Dashboard with system statistics
- `/superadmin/tenants` - Tenant management
- `/superadmin/users` - Cross-tenant user management
- Protected by role check (superadmin only)

#### API Endpoints
- `/api/superadmin/tenants` - CRUD for tenants
- `/api/superadmin/users` - CRUD for users across tenants
- `/api/superadmin/stats` - System-wide statistics

### 8. Login System

#### Multi-Mode Login (`/app/admin/login`)
Supports two authentication modes:
1. **Legacy Mode**: Password only (backward compatibility)
2. **Multi-Tenant Mode**: Email + Password

Features:
- Toggle between modes
- Auto-redirect based on role (admin → /admin, superadmin → /superadmin)
- Tenant detection from subdomain

### 9. Subscription Tiers

#### Plans
1. **Trial** (30 days)
   - Default for new tenants
   - Full features with small limits

2. **Small Ensemble** ($79/month)
   - 50 musicians, 5 projects, 10 instruments

3. **Medium Ensemble** ($499/month)
   - 200 musicians, 20 projects, unlimited instruments

4. **Institution** ($1,500/month)
   - Unlimited everything
   - Dedicated database option
   - Custom branding

### 10. Security Considerations

#### Tenant Isolation
- Row-level security via Prisma middleware
- Tenant ID validation in API routes
- Separate databases for enterprise customers

#### Authentication
- JWT tokens with tenant context
- Role-based access control
- Superadmin bypass for cross-tenant operations

#### Edge Runtime Compatibility
- Auth functions split for Edge Runtime support
- No Prisma imports in middleware
- Lightweight JWT operations only

## Migration Guide

### From Single-Tenant to Multi-Tenant

1. **Run Database Migration**
   ```sql
   -- Execute /prisma/migrations/manual/add_multi_tenant_schema.sql
   ```

2. **Update Environment Variables**
   ```env
   JWT_SECRET=your-secret-here
   DEFAULT_TENANT_SUBDOMAIN=default
   ```

3. **Default Data**
   - All existing data migrated to 'default-tenant'
   - Default admin user created for backward compatibility
   - Email templates generated for each tenant

### API Route Migration

Replace in all API routes:
```typescript
// Old
import { prisma } from '@/lib/prisma'

// New
import { prismaMultitenant } from '@/lib/prisma-multitenant'
```

Add tenant context wrapper:
```typescript
import { withTenant } from '@/lib/api-utils'

export const GET = withTenant(async (request) => {
  // Your API logic here
})
```

## Development Workflow

### Creating a New Tenant

1. Use superadmin interface or API:
   ```typescript
   POST /api/superadmin/tenants
   {
     "name": "Göteborg Symphony",
     "subdomain": "goteborg",
     "subscription": "medium_ensemble",
     "adminEmail": "admin@goteborg.se",
     "adminPassword": "secure-password"
   }
   ```

2. System automatically:
   - Creates tenant record
   - Creates admin user
   - Generates email templates
   - Sets up ID sequences

### Testing Multi-Tenancy

1. **Local Development**
   - Default tenant used when no subdomain
   - Add to hosts file: `127.0.0.1 tenant1.localhost`
   - Access: `http://tenant1.localhost:3000`

2. **Production**
   - Wildcard DNS: `*.stagesub.com`
   - Each tenant: `tenant.stagesub.com`

## Troubleshooting

### Common Issues

1. **Edge Runtime Error**
   - Ensure no Prisma imports in middleware
   - Use auth-edge functions only

2. **Tenant Not Found**
   - Check subdomain spelling
   - Verify tenant exists in database
   - Check middleware tenant extraction

3. **Data Leakage**
   - Verify Prisma middleware is active
   - Check all queries include tenant filter
   - Review API route implementations

### Debug Mode

Enable debug logging:
```typescript
// In prisma-multitenant.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})
```