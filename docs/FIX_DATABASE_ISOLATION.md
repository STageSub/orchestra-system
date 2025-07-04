# Fixing Database Isolation Issues

## Problem
The GitHub Actions workflow `database-isolation-test.yml` is failing because it detects that multiple orchestras are sharing the same database URL. This is a critical security issue.

## Root Cause
1. Orchestras were created before the validation was added to prevent duplicate database URLs
2. The validation in `/app/api/superadmin/orchestras/route.ts` only prevents NEW duplicates, but doesn't fix existing ones
3. The GitHub Actions workflow checks ALL orchestras and fails if any share databases

## Solution

### Step 1: Run the Fix Script Locally
```bash
npx tsx scripts/fix-database-isolation.ts
```

This script will:
- Find all orchestras sharing databases
- Keep the oldest assignment for each database
- Clear the database URL for newer duplicates
- Set their status to 'pending'

### Step 2: Assign New Databases
For each orchestra that had its database cleared:
1. Go to the superadmin panel
2. Create a new database for the orchestra
3. Or use the provisioning endpoint if you have automatic provisioning set up

### Step 3: Verify the Fix
```bash
npx tsx scripts/verify-database-isolation.ts
```

This should now show that all orchestras have separate databases.

### Step 4: Re-run GitHub Actions
The workflow should now pass.

## Prevention
The validation is already in place to prevent this from happening again:
- `/app/api/superadmin/orchestras/route.ts` lines 226-248 check for duplicate database URLs
- Any attempt to create or update an orchestra with a duplicate database URL will be rejected

## Manual Database Assignment (If Needed)
If you need to manually assign a database URL:
1. Make sure the URL is unique
2. Use the Supabase dashboard to create a new project
3. Get the connection string from Supabase
4. Update the orchestra record with the new URL

## Environment Variables for Pooled Databases
If using pooled databases, ensure each pool database is only assigned once:
- `DATABASE_URL_POOL_1` - Only one orchestra
- `DATABASE_URL_POOL_2` - Only one orchestra
- etc.

## Monitoring
The GitHub Actions workflow runs daily at 08:00 UTC to ensure database isolation is maintained.