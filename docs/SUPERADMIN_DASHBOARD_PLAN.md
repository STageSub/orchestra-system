# Superadmin Dashboard Implementation Plan

*Created: 2025-07-04*

## Overview
Complete redesign of the superadmin dashboard to be fully self-contained in the central Neon database, with data aggregation from orchestra databases via webhooks/APIs.

## Architecture

### Central Database (Neon) - Superadmin Only
All superadmin data lives in the central database, completely independent from orchestra databases.

#### Existing Tables
- `Orchestra` - Orchestra configurations
- `User` - User management across all orchestras

#### New Tables to Add

```prisma
model OrchestraMetrics {
  id            String   @id @default(cuid())
  orchestraId   String
  orchestra     Orchestra @relation(fields: [orchestraId], references: [id])
  date          DateTime @default(now())
  
  // Daily metrics
  totalMusicians Int
  activeMusicians Int
  totalProjects  Int
  activeProjects Int
  totalRequests  Int
  acceptedRequests Int
  
  // Usage metrics
  emailsSent     Int
  storageUsedMB  Float
  apiCalls       Int
  
  @@unique([orchestraId, date])
  @@index([date])
}

model Subscription {
  id            String   @id @default(cuid())
  orchestraId   String   @unique
  orchestra     Orchestra @relation(fields: [orchestraId], references: [id])
  
  plan          String   // small, medium, enterprise
  status        String   // trial, active, cancelled, suspended
  pricePerMonth Int
  currency      String   @default("SEK")
  
  trialEndsAt   DateTime?
  startedAt     DateTime @default(now())
  cancelledAt   DateTime?
  nextBillingAt DateTime?
  
  // Limits
  maxMusicians  Int
  maxProjects   Int
  maxRequests   Int
  maxStorageGB  Float
}

model BillingHistory {
  id            String   @id @default(cuid())
  orchestraId   String
  orchestra     Orchestra @relation(fields: [orchestraId], references: [id])
  
  amount        Float
  currency      String
  status        String   // paid, pending, failed
  invoiceUrl    String?
  
  billingPeriodStart DateTime
  billingPeriodEnd   DateTime
  paidAt        DateTime?
  createdAt     DateTime @default(now())
}

model SystemEvent {
  id            String   @id @default(cuid())
  orchestraId   String?
  orchestra     Orchestra? @relation(fields: [orchestraId], references: [id])
  
  type          String   // orchestra_created, subscription_changed, payment_received
  severity      String   // info, warning, error, critical
  title         String
  description   String?
  metadata      Json?
  
  createdAt     DateTime @default(now())
  
  @@index([type])
  @@index([createdAt])
}

model SystemHealth {
  id            String   @id @default(cuid())
  orchestraId   String
  orchestra     Orchestra @relation(fields: [orchestraId], references: [id])
  
  timestamp     DateTime @default(now())
  isHealthy     Boolean
  responseTimeMs Int
  errorRate     Float
  
  // Health metrics
  databaseStatus String
  apiStatus      String
  emailStatus    String
  
  lastError     String?
  
  @@index([orchestraId, timestamp])
}
```

### Data Flow Architecture

```
Orchestra Database (Supabase) → Webhook/API → Superadmin API → Central Database (Neon)
```

**Key Principles:**
1. NO direct connections from superadmin to orchestra databases
2. All data flows INTO the central database
3. Orchestra databases remain completely isolated
4. Historical data is preserved centrally

### Data Synchronization

#### 1. Real-time Events (Webhooks)
Each orchestra sends events when:
- New musician added/removed
- Project created/completed
- Request sent/responded
- User login/activity
- Errors or warnings

#### 2. Daily Metrics Collection
Nightly cron job triggers each orchestra to send:
- Total counts (musicians, projects, requests)
- Usage statistics
- Storage consumption
- Performance metrics

#### 3. On-demand Updates
Superadmin can request fresh data from specific orchestras

## Dashboard Features

### 1. Overview Dashboard
- **Key Metrics Cards**
  - Total orchestras (active/inactive)
  - Total revenue (MRR)
  - System-wide usage
  - Growth trends
  
- **Charts & Visualizations**
  - Revenue growth (30/90/365 days)
  - Orchestra activity heatmap
  - Usage by plan type
  - Geographic distribution

- **Real-time Alerts**
  - New signups
  - Failed payments
  - System errors
  - Orchestras near limits

### 2. Orchestra Management
- **Enhanced List View**
  - Health status indicators
  - Usage progress bars
  - Last activity
  - Quick actions
  
- **Detailed Orchestra View**
  - Usage metrics & trends
  - User management
  - Billing history
  - Activity timeline
  - Direct support

### 3. Financial Dashboard
- **Revenue Analytics**
  - MRR breakdown by plan
  - Payment success rates
  - Churn analysis
  - Revenue forecasting
  
- **Billing Management**
  - Upcoming renewals
  - Failed payments
  - Invoice generation
  - Refund processing

### 4. System Health
- **Infrastructure Monitoring**
  - Orchestra health status
  - API performance
  - Error rates
  - Resource usage
  
- **Performance Metrics**
  - Response times by endpoint
  - Email delivery rates
  - Background job status
  - Database performance

### 5. User Analytics
- **User Insights**
  - Active users by orchestra
  - Feature adoption
  - User roles distribution
  - Login patterns

## Implementation Phases

### Phase 1: Database Schema (Week 1)
- Create migration for new tables
- Set up foreign keys and indexes
- Create initial seed data

### Phase 2: Data Collection APIs (Week 2)
- Build webhook endpoints for orchestras
- Create metrics aggregation service
- Implement data validation

### Phase 3: Dashboard API (Week 3)
- New superadmin API endpoints
- Caching layer (Redis)
- Authentication & authorization

### Phase 4: UI Implementation (Week 4-5)
- Redesign dashboard components
- Add charts (Chart.js/Recharts)
- Real-time updates (polling/SSE)

### Phase 5: Advanced Features (Week 6)
- Automated alerts
- Export functionality
- API for integrations

## Security Considerations
- Separate superadmin authentication
- Audit logging for all actions
- Encrypted sensitive data
- IP whitelist option
- Rate limiting

## Performance Optimizations
- Redis caching for dashboard data
- Database query optimization
- Lazy loading for details
- Background processing
- CDN for assets

## Benefits of This Architecture
1. **Scalability**: Can handle 100+ orchestras without performance degradation
2. **Security**: Complete isolation between orchestras and superadmin
3. **Performance**: No need to query multiple databases for dashboard
4. **Maintainability**: Single source of truth for admin data
5. **Reliability**: Orchestra database issues don't affect superadmin

## Next Steps
1. Review and approve plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Weekly progress reviews

---

*This plan ensures complete separation between superadmin and orchestra systems while providing comprehensive monitoring and management capabilities.*