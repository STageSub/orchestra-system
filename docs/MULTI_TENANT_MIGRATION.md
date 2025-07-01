# Multi-Tenant Migration Guide

This guide explains how to run the multi-tenant migration for the Orchestra System.

## Prerequisites

1. Make sure you have access to your Supabase dashboard
2. Backup your database before running the migration
3. Ensure no users are actively using the system during migration

## Migration Steps

### 1. Run the SQL Migration

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/prisma/migrations/manual/add_multi_tenant_schema.sql`
4. Paste and run the SQL in the editor

### 2. Update Prisma Client

After running the SQL migration:

```bash
# Generate new Prisma client
npx prisma generate

# Pull the schema to sync with database
npx prisma db pull
```

### 3. Verify Migration

The migration creates:
- A `Tenant` table for managing multiple orchestras
- A `User` table for authentication
- Adds `tenantId` to all existing tables
- Creates a default tenant with ID `default-tenant`
- Migrates all existing data to the default tenant
- Creates a default admin user (email: `admin@default.orchestra`, password: `admin123`)

### 4. Update Environment Variables

Add these new environment variables:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret-here

# Default tenant subdomain
DEFAULT_TENANT_SUBDOMAIN=default
```

## Post-Migration Tasks

1. **Change default admin password**: Login with `admin@default.orchestra` / `admin123` and change the password immediately
2. **Update application code**: The application code needs to be updated to handle multi-tenancy
3. **Test thoroughly**: Verify all existing functionality works with the default tenant

## Rollback Plan

If you need to rollback:

1. Remove the foreign key constraints
2. Drop the `tenantId` columns from all tables
3. Drop the `Tenant` and `User` tables
4. Restore from backup if needed

## Notes

- All existing data is migrated to a default tenant
- The system remains backward compatible during the transition
- No data is lost during migration
- The migration is idempotent (can be run multiple times safely)