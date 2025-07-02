# Dynamic Customer Configuration Migration Guide

## Overview

This guide explains how to migrate from the hardcoded database configuration to the new dynamic customer configuration system.

## What Changed

### Before (Hardcoded)
- Customer databases were hardcoded in `/lib/database-config.ts`
- Adding new customers required code changes and redeployment
- No UI for managing customers

### After (Dynamic)
- Customer configurations stored in `customer-config.json`
- Superadmin UI for managing customers
- No code changes needed for new customers

## Migration Steps

### 1. Update Environment Variables

No changes needed! The system still uses the same environment variables:
```bash
DATABASE_URL_GOTEBORG=postgresql://...
DATABASE_URL_MALMO=postgresql://...
DATABASE_URL_STOCKHOLM=postgresql://...
DATABASE_URL_UPPSALA=postgresql://...
```

### 2. Review customer-config.json

The file has been created with your existing customers:
```json
{
  "customers": [
    {
      "id": "goteborg",
      "name": "Göteborgs Symfoniker",
      "subdomain": "goteborg",
      "databaseUrl": "env:DATABASE_URL_GOTEBORG",
      "status": "active",
      "plan": "enterprise"
    }
    // ... other customers
  ]
}
```

### 3. Update API Routes (if needed)

Most API routes work without changes. However, if you have custom code that uses:
- `getPrismaClient()` - Now returns a Promise
- `getConfiguredCustomers()` - Now returns a Promise
- `getPrismaFromHeaders()` - Now returns a Promise

Update them to use `await`:
```typescript
// Before
const prisma = getPrismaClient(subdomain)

// After
const prisma = await getPrismaClient(subdomain)
```

### 4. Access Customer Management

1. Login to superadmin at `/superadmin`
2. Click on "Kundhantering" tab
3. You can now:
   - View all customers
   - Add new customers
   - Edit existing customers
   - Delete inactive customers

## Adding New Customers

### Via UI (Recommended)
1. Go to Superadmin → Kundhantering
2. Click "Lägg till kund"
3. Fill in customer details
4. Add database URL to environment variables
5. Deploy with new environment variable

### Via API
```bash
curl -X POST http://localhost:3001/api/superadmin/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ny Orkester",
    "subdomain": "nyorkester",
    "contactEmail": "admin@nyorkester.se",
    "plan": "medium"
  }'
```

## Database URL Format

The `databaseUrl` field supports two formats:

1. **Environment Variable Reference** (Recommended)
   ```
   env:DATABASE_URL_SUBDOMAIN
   ```
   This reads from `process.env.DATABASE_URL_SUBDOMAIN`

2. **Direct URL** (Not recommended for production)
   ```
   postgresql://user:pass@host:5432/db
   ```

## Troubleshooting

### Customer not recognized
- Check that customer is in `customer-config.json`
- Ensure status is "active"
- Clear caches: restart the application

### Database connection fails
- Verify environment variable exists
- Check database URL format
- Ensure database is accessible

### Changes not reflected
- The system caches configurations for 1 minute
- Restart the app or wait for cache to expire

## Rollback Plan

If you need to rollback:
1. Keep the old `database-config.ts` file
2. Revert the changes
3. Remove `customer-config.json`
4. Redeploy

## Benefits

1. **No Code Changes** - Add customers without touching code
2. **Instant Updates** - Changes via UI take effect immediately
3. **Better Overview** - See all customers and their status
4. **Plan Tracking** - Track customer plans for billing
5. **Scalable** - Ready for hundreds of customers

## Next Steps

After migration, you can:
1. Implement Stripe webhook integration
2. Add automatic database provisioning
3. Create customer onboarding flow
4. Build usage analytics per customer