# Subdomain Routing Testing Guide

## Overview

This guide explains how to test and verify that subdomain routing is working correctly in the Orchestra System.

## Prerequisites

### 1. Configure /etc/hosts
Add these entries to your hosts file to enable subdomain testing locally:

```bash
# Mac/Linux: /etc/hosts
# Windows: C:\Windows\System32\drivers\etc\hosts

127.0.0.1 goteborg.localhost
127.0.0.1 malmo.localhost
127.0.0.1 stockholm.localhost
127.0.0.1 uppsala.localhost
```

### 2. Configure Environment Variables
Ensure your `.env.local` has database URLs for each subdomain:

```env
DATABASE_URL_GOTEBORG=postgresql://...
DATABASE_URL_MALMO=postgresql://...
DATABASE_URL_STOCKHOLM=postgresql://...
DATABASE_URL_UPPSALA=postgresql://...
```

### 3. Update Customer Configuration
Ensure `customer-config.json` has entries for each subdomain with status "active".

## Testing Tools

### 1. Simple Subdomain Test
Tests basic subdomain detection without requiring multiple databases:

```bash
node test-subdomain-simple.js
```

This test:
- Verifies middleware is detecting subdomains
- Tests the health endpoint
- Provides setup instructions

### 2. Full Routing Test
Comprehensive test that verifies data isolation:

```bash
node test-subdomain-routing.js
```

This test:
- Tests multiple endpoints for each subdomain
- Creates test data in one database
- Verifies it doesn't appear in others
- Checks for data leaks

### 3. Manual Browser Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit different subdomains:
   - http://goteborg.localhost:3001/admin
   - http://malmo.localhost:3001/admin
   - http://stockholm.localhost:3001/admin

3. Login to each and verify:
   - Different musicians appear
   - Different projects appear
   - Changes in one don't affect others

## API Route Update Automation

### Running the Update Script

To update all API routes to use subdomain-aware Prisma:

1. **Dry run** (see what would change):
   ```bash
   node scripts/update-api-routes-auto.js --dry-run
   ```

2. **Actual update**:
   ```bash
   node scripts/update-api-routes-auto.js
   ```

3. **Review changes**:
   - Check git diff
   - Test updated endpoints
   - Remove .bak files when satisfied

### What the Script Does

1. Finds all `route.ts` files in `/app/api/`
2. Updates imports from `@/lib/prisma` to `@/lib/prisma-subdomain`
3. Adds `request: Request` parameter to functions that need it
4. Adds `const prisma = await getPrismaForRequest(request)`
5. Updates `generateUniqueId()` calls to pass prisma parameter
6. Creates backup files (.bak)

### Manual Updates Required

Some files need manual attention:
- `/api/respond/route.ts` - Used by musicians from emails
- `/api/superadmin/*` - May need multi-database access
- Test routes - Development only

## Troubleshooting

### Subdomain Not Detected
1. Check middleware is running (check console logs)
2. Verify hosts file entries
3. Check browser is sending correct Host header

### Wrong Database Used
1. Check DATABASE_URL_[SUBDOMAIN] is set
2. Verify customer is "active" in customer-config.json
3. Check for typos in subdomain names

### Connection Errors
1. Verify database URLs are correct
2. Check database is accessible
3. Look for connection pool exhaustion

### Data Appearing in Wrong Database
1. Check API route is updated to use `getPrismaForRequest`
2. Verify middleware is setting x-subdomain header
3. Check for hardcoded prisma imports

## Verification Checklist

- [ ] Hosts file configured
- [ ] Environment variables set
- [ ] Customer configuration updated
- [ ] Simple test passes
- [ ] Full routing test passes
- [ ] Manual browser test shows isolation
- [ ] API routes updated (at least critical ones)
- [ ] No data leaks between subdomains

## Next Steps

1. Update remaining API routes
2. Set up automated tests in CI/CD
3. Add monitoring for subdomain routing
4. Document production deployment