# 📋 TODO - Orchestra System

## ✅ Completed Today (2025-07-02)

### Critical Fixes
- [x] **Fixed tenant data leakage** - Reverted to separate database architecture
- [x] **Fixed ChunkLoadError** - Complete cache clear solved it
- [x] **Fixed superadmin login** - Added missing SUPERADMIN_PASSWORD
- [x] **Simplified superadmin dashboard** - Removed multi-tenant dependencies
- [x] **Verified all features work** - 157 musicians showing, data saves correctly

### Documentation
- [x] Created comprehensive session continuation guide
- [x] Documented separate database architecture
- [x] Updated daily work log

### Dynamic Customer Configuration (2025-07-02)
- [x] **Moved from JSON to Prisma-based customer storage**
  - [x] CustomerService now uses Prisma Customer model
  - [x] All CRUD operations work through database
  - [x] Environment variable support maintained
- [x] **Superadmin Customer Management UI**
  - [x] Full CRUD interface in superadmin dashboard
  - [x] Add/Edit/Delete customers
  - [x] Shows plan, status, and database info
- [x] **API Endpoints Created**
  - [x] GET/POST /api/superadmin/customers
  - [x] GET/PUT/DELETE /api/superadmin/customers/[id]
- [x] **Migration Documentation**
  - [x] Created DYNAMIC_CONFIGURATION_MIGRATION.md
  - [x] Database provisioning strategy documented

### Edge Runtime Compatibility (2025-07-02)
- [x] **Removed all Node.js-specific modules**
  - [x] Migrated CustomerService from fs/path to Prisma
  - [x] Migrated Orchestra management from fs/path to Prisma
  - [x] Created FileStorage table for file content
  - [x] Updated email service to fetch files from DB/HTTP
  - [x] Created migration scripts for existing data
- [x] **Database Schema Updates**
  - [x] Added Customer table
  - [x] Added Orchestra table
  - [x] Added FileStorage table
- [x] **Backward Compatibility**
  - [x] Email service handles both DB and legacy file URLs
  - [x] File upload API uses new DB storage
  - [x] Created /api/files/[id] endpoint for serving files

## 🚀 High Priority - New Orchestra System

### Create New Orchestra from Superadmin
- [ ] **Implement "Create New Orchestra" UI**
  - [ ] Form page at `/superadmin/orchestras/new`
  - [ ] Fields: Name, subdomain, contact email
  - [ ] Validation for unique subdomain
  
- [ ] **Database Provisioning API**
  - [ ] POST `/api/superadmin/orchestras`
  - [ ] Create new PostgreSQL database
  - [ ] Run Prisma migrations
  - [ ] Seed initial data (instruments, templates)
  
- [x] **Dynamic Configuration** ✅ COMPLETED
  - [x] Store database URLs in Prisma Customer table
  - [x] Update database-config.ts dynamically
  - [x] CustomerService handles all operations

### Multi-Database Testing
- [ ] **Create Uppsala test database**
  - [ ] Add DATABASE_URL_UPPSALA to .env.local
  - [ ] Update database-config.ts
  - [ ] Run migrations on new database
  
- [ ] **Test subdomain routing**
  - [ ] uppsala.localhost:3000 → Uppsala DB
  - [ ] goteborg.localhost:3000 → Göteborg DB
  - [ ] Verify complete isolation
  
- [ ] **Performance testing**
  - [ ] Concurrent access to different DBs
  - [ ] Connection pooling efficiency
  - [ ] Response time comparison

### Restore Superadmin Features
- [ ] **Orchestra Management**
  - [ ] List all orchestras with stats
  - [ ] Edit orchestra details
  - [ ] Enable/disable orchestras
  
- [ ] **Aggregated Statistics**
  - [ ] Total musicians across all DBs
  - [ ] Total projects across all DBs
  - [ ] Usage patterns and trends
  
- [ ] **Database Operations**
  - [ ] Health monitoring per DB
  - [ ] Backup/restore individual DBs
  - [ ] Migration status tracking

## 🔴 KRITISKA BUGGAR ATT FIXA FÖRE SaaS (Från tidigare)

### ✅ Redan lösta
- [x] E-posthistorik fungerar inte
- [x] Lokalt boende-filter
- [x] Konfliktvarningar och strategier
- [x] Toast-notifikationer
- [x] Moment 22 med strategi/antal
- [x] Instrument laddas utan feedback
- [x] Arkivera musiker redirect
- [x] Archive/restore för instrument

### 🔴 Kvarstående problem
- [ ] **Synkronisera Preview/Sändningslogik**
  - [ ] FCFS preview visar bara en mottagare när maxRecipients är tomt
  - [ ] Preview respekterar inte lokalt boende-filter
  - [ ] Preview hanterar inte konflikter korrekt
  - [ ] Extrahera gemensam logik för preview och sändning

### Mindre förbättringar
- [ ] Visningsordning i instrumentredigering - Ta bort från UI
- [ ] Ta bort-knapp placering - Flytta till redigeringsvyn

## 📅 Implementation Timeline

### Week 1 (Current)
- [x] Fix critical data leakage
- [x] Implement separate database architecture
- [ ] Create orchestra provisioning system
- [ ] Test multi-database setup

### Week 2
- [ ] Restore superadmin features
- [ ] Implement orchestra management UI
- [ ] Add database monitoring

### Week 3
- [ ] Automated provisioning
- [ ] Backup/restore functionality
- [ ] Performance optimization

### Future Considerations
- [ ] Hybrid approach (small = shared, large = dedicated)
- [ ] Edge deployment for global orchestras
- [ ] Self-service orchestra creation

## 📝 Notes

### Architecture Decision
We chose separate databases over multi-tenant for:
- 100% data isolation (no leakage risk)
- Simpler security model
- Better performance (no tenant filtering)
- Easier debugging and maintenance

### Lost Features to Consider
From the multi-tenant implementation:
- Subscription tiers (Small/Medium/Institution)
- Usage limits and quotas
- Centralized user management
- Automated billing integration

These can be reimplemented later if needed, but with the separate database approach.