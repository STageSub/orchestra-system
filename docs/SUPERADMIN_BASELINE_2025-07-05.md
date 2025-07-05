# Superadmin Dashboard Baseline Documentation
**Date: 2025-07-05**
**Status: Working State Before Enhancements**

## Purpose
This document captures the working state of the superadmin dashboard before implementing enhancements for per-orchestra configuration management. Use this as a reference if anything breaks during development.

## 1. Current Working Features

### ✅ Fully Working:
1. **Authentication**: 
   - Superadmin login with JWT tokens
   - Session management with httpOnly cookies
   - Rate limiting on login attempts

2. **Orchestra Management**:
   - Create new orchestras with automatic database provisioning
   - View all orchestras with status indicators
   - Reset SCOSO demo data
   - Orchestra status management (active/inactive)

3. **Dashboard Overview**:
   - Total orchestras count
   - Total musicians across all orchestras
   - Total projects across all orchestras
   - Monthly Recurring Revenue (MRR)
   - Recent events feed

4. **User Management**:
   - List all users across orchestras
   - Create new users
   - Edit user details
   - Archive/restore users
   - Password reset functionality

5. **Database Health**:
   - Real-time health checks for all configured databases
   - Status indicators (healthy/error/no-database)
   - API and email service status

### ⚠️ Partially Working:
1. **Quick Actions** - Currently shows mock alerts:
   - "Run migrations on all databases"
   - "Update all schemas"
   - "Clear cache for all orchestras"

2. **Orchestra Provisioning Modal** - Shows progress but doesn't actually provision

3. **Customer Management** - Basic CRUD but not fully integrated

### ❌ Known Issues:
1. **Duplicate Create Orchestra Buttons**:
   - One in Overview tab (goes to /superadmin/orchestras/new)
   - One in Orchestra Management tab (opens modal)
   - These are different implementations

2. **Mock Features**:
   - Quick Actions only show alerts
   - Provisioning is simulated, not real

## 2. API Endpoints (All Working)

### Authentication:
- `POST /api/auth/login` - Login with username/password or just password
- `POST /api/auth/logout` - Clear session

### Metrics & Stats:
- `GET /api/superadmin/metrics` - Main dashboard data
- `GET /api/superadmin/stats` - Additional statistics
- `GET /api/superadmin/activity` - Recent events
- `GET /api/superadmin/health` - System health check

### Orchestra Management:
- `GET /api/superadmin/orchestras` - List all orchestras
- `POST /api/superadmin/orchestras` - Create new orchestra
- `GET /api/superadmin/orchestras/[id]` - Get orchestra details
- `PUT /api/superadmin/orchestras/[id]` - Update orchestra
- `PATCH /api/superadmin/orchestras/[id]` - Update orchestra status
- `POST /api/superadmin/orchestras/[id]/reset-demo` - Reset SCOSO demo

### User Management:
- `GET /api/superadmin/users` - List all users
- `POST /api/superadmin/users` - Create new user
- `GET /api/superadmin/users/[id]` - Get user details
- `PUT /api/superadmin/users/[id]` - Update user
- `DELETE /api/superadmin/users/[id]` - Archive user
- `POST /api/superadmin/users/[id]/reset-password` - Reset password

### Customer Management:
- `GET /api/superadmin/customers` - List customers
- `POST /api/superadmin/customers` - Create customer
- `GET /api/superadmin/customers/[id]` - Get customer
- `PUT /api/superadmin/customers/[id]` - Update customer
- `DELETE /api/superadmin/customers/[id]` - Delete customer

## 3. Database Schema (Central Database - Neon)

```prisma
model Orchestra {
  id            String   @id @default(cuid())
  orchestraId   String   @unique @default(cuid())
  name          String
  subdomain     String   @unique
  databaseUrl   String?
  status        String   @default("pending")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  contactName   String
  contactEmail  String
  plan          String   @default("medium")
  maxMusicians  Int      @default(200)
  maxProjects   Int      @default(20)
  pricePerMonth Int      @default(4990)
  logoUrl       String?
  users         User[]
}

model User {
  id                String     @id @default(cuid())
  email             String     @unique
  role              String     @default("user")
  orchestraId       String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  passwordHash      String
  active            Boolean    @default(true)
  username          String     @unique
  lastLogin         DateTime?
  isArchived        Boolean    @default(false)
  localResident     Boolean    @default(false)
  preferredLanguage String?    @default("sv")
  orchestra         Orchestra? @relation(fields: [orchestraId], references: [id], onDelete: Cascade)
}

model Customer {
  id           String   @id @default(cuid())
  name         String
  subdomain    String   @unique
  databaseUrl  String
  status       String   @default("active")
  contactEmail String
  plan         String   @default("small")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SystemLog {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  level       String
  category    String
  message     String
  metadata    Json?
  userId      String?
  orchestraId String?
  subdomain   String?
  ip          String?
  userAgent   String?
  requestId   String?
  duration    Int?
}
```

## 4. Current Data Flow

1. **Metrics Collection**:
   - Superadmin dashboard queries each orchestra database directly
   - Aggregates data in real-time (no caching)
   - Shows latest metrics from OrchestraMetrics table

2. **Authentication**:
   - JWT token in `orchestra-admin-session` cookie
   - Validated by `checkSuperadminAuth()` middleware
   - 24-hour session timeout

3. **Database Routing**:
   - Main database: `CENTRAL_DATABASE_URL` (Neon)
   - Orchestra databases: `DATABASE_URL_[SUBDOMAIN]` or pooled connections
   - Fallback to pooled databases if specific URL not found

## 5. UI Components Structure

### Main Dashboard (`/app/superadmin/page.tsx`):
- Tab navigation: Overview, Customers, Orchestras, Users
- Stats grid with 4 metric cards
- Orchestra table with actions
- Recent events feed

### Orchestra Management (`/components/superadmin/OrchestraManagement.tsx`):
- Quick Actions card
- Database Health card
- System Status card
- Create Orchestra modal (currently mock)

### User Management (`/components/superadmin/UserManagement.tsx`):
- User table with search
- Create/Edit user forms
- Archive/Restore functionality

## 6. Current Configuration

### Environment Variables in Use:
```bash
# Authentication
JWT_SECRET=your-secret-key
SUPERADMIN_PASSWORD=admin123

# Database
CENTRAL_DATABASE_URL=postgresql://...@neon.tech/...
DATABASE_URL=postgresql://...  # Same as CENTRAL_DATABASE_URL

# Orchestra Databases
DATABASE_URL_SCO=postgresql://...
DATABASE_URL_GOTHENBURG=postgresql://...
DATABASE_URL_SCOSCO=postgresql://...

# Pooled Databases (Fallback)
DATABASE_URL_POOL_1=postgresql://...
DATABASE_URL_POOL_2=postgresql://...
DATABASE_URL_POOL_3=postgresql://...
```

### Configured Orchestras:
1. **SCO** - Stockholm Concert Orchestra (active)
2. **Gothenburg** - Gothenburg Symphony Orchestra (active)
3. **SCOSCO** - Demo orchestra (active, resettable)

## 7. Recent Safari Authentication Fix

Just implemented fixes for Safari cookie issues:
- Created user-agent detection utility
- Standardized cookie settings (sameSite: 'lax')
- Enhanced cookie removal for Safari
- Added cache control headers
- Pre-login cookie clearing for Safari

## 8. Files Not to Break

Critical files that must continue working:
- `/lib/auth-superadmin.ts` - Core authentication
- `/lib/auth-db.ts` - User authentication
- `/lib/database-config.ts` - Database routing
- `/app/api/superadmin/metrics/route.ts` - Main dashboard data
- `/middleware.ts` - Authentication middleware

## 9. Test Coverage

Available test scripts:
- `/scripts/test-superadmin-apis.ts` - API testing
- `/scripts/test-superadmin-complete.sh` - Full test suite
- `/scripts/test-superadmin-curl.sh` - cURL tests

---

**Important**: This baseline was created on 2025-07-05 when the superadmin dashboard was working correctly. Any changes should be tested against this baseline to ensure nothing breaks.