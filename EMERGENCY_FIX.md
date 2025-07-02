# Emergency Fix: Database Schema Mismatch

## Problem
The database schema in Supabase was changed during the multi-tenant implementation, but we only reverted the code files. The database still has multi-tenant schema changes that are causing errors.

## Errors You're Seeing:
- "Tenant context required for X operations"
- "Invalid prisma.idSequence.update() invocation"
- Cannot create musicians or instruments

## Solution

### Step 1: Clear Next.js Cache (Already Done)
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### Step 2: Fix Database Schema
Run the SQL script in your Supabase dashboard:

1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `/scripts/fix-database-schema.sql`
4. Run the script

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Test
```bash
npm run dev
```

## What This Fixes:
- Removes all multi-tenant columns (tenantId) from tables
- Fixes IdSequence table to use simple unique constraint
- Removes tenant-related tables
- Restores database to match the reverted code

## Alternative: Full Database Reset
If the above doesn't work, you can reset the database completely:
```bash
npx prisma migrate reset
```
This will delete all data and recreate the schema from scratch.