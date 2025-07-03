# Orchestra Provisioning Guide

## Overview

This guide explains how to provision a new orchestra in the StageSub system using the separate database architecture.

## Prerequisites

- Access to Supabase dashboard
- Superadmin access to StageSub
- Environment variables configured

## Step 1: Create Database in Supabase

1. Log in to your Supabase dashboard
2. Create a new project for the orchestra
3. Note down the database credentials:
   - Database URL (pooler connection)
   - Direct connection URL (for migrations)

## Step 2: Configure Environment Variables

Add the new database to your pool in `.env.local`:

```env
# Existing main database
DATABASE_URL=postgresql://...your-main-db...

# Database pool for new orchestras
DATABASE_URL_POOL_1=postgresql://...first-orchestra-db...
DATABASE_URL_POOL_2=postgresql://...second-orchestra-db...
```

## Step 3: Create Orchestra in Superadmin

1. Go to https://admin.stagesub.com/superadmin
2. Click on "Orkestrar" tab
3. Click "Skapa ny orkester"
4. Fill in the details:
   - Orchestra name
   - Subdomain (e.g., "malmo" for malmo.stagesub.com)
   - Contact person name
   - Contact email
5. Click "Skapa Orkester"

## Step 4: Provision Database

### Option A: Via UI (Recommended)

1. In the Orchestras list, find your newly created orchestra
2. Click "Provisionera databas"
3. Wait for the process to complete
4. The system will:
   - Assign an available database from the pool
   - Seed initial data (email templates, settings)
   - Update the orchestra status to "Active"

### Option B: Manual Setup

If automatic provisioning fails, you can run the setup manually:

1. SSH into your server or open terminal
2. Run the setup script:

```bash
npm run setup-orchestra "postgresql://...db-url..." "Orchestra Name" "subdomain"
```

3. Update the orchestra record in the database to mark it as active

## Step 5: Configure DNS (If New Subdomain)

1. Add a CNAME record in your DNS provider:
   ```
   subdomain.stagesub.com → your-app-domain
   ```

2. Wait for DNS propagation (usually 5-30 minutes)

## Step 6: Verify Setup

1. Visit https://subdomain.stagesub.com
2. You should see the login page
3. Log in with the default admin credentials
4. Check that:
   - Email templates are created
   - System settings are configured
   - Database connection is working

## Troubleshooting

### "No databases available in pool"

- Add more database URLs to your environment variables
- Create more databases in Supabase

### "Failed to seed database"

- Check that migrations are up to date
- Verify database connection string
- Check Prisma schema compatibility

### Subdomain not working

- Verify DNS configuration
- Check middleware subdomain extraction
- Ensure database URL mapping is correct

## Database Pool Management

### Adding More Databases to Pool

1. Create new database in Supabase
2. Add to `.env.local`:
   ```env
   DATABASE_URL_POOL_3=postgresql://...
   DATABASE_URL_POOL_4=postgresql://...
   ```
3. Restart the application

### Monitoring Pool Usage

Check which databases are assigned:

```sql
SELECT subdomain, databaseUrl, status 
FROM "Orchestra" 
WHERE databaseUrl IS NOT NULL;
```

## Security Considerations

1. **Never share database URLs** in logs or error messages
2. **Use pooler connections** for the application
3. **Use direct connections** only for migrations
4. **Rotate credentials** regularly
5. **Monitor access logs** in Supabase

## Best Practices

1. **Test in staging first** before provisioning production orchestras
2. **Backup main database** before running provisioning
3. **Document each orchestra** with contact info and setup date
4. **Monitor database usage** to plan for scaling
5. **Use consistent naming** for subdomains (lowercase, no spaces)