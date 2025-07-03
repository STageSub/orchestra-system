# Automatic Database Provisioning Guide

## Overview

StageSub now supports automatic database creation for new orchestras using the Supabase Management API. This eliminates the need for manual database setup and provides a seamless onboarding experience.

## Setup

### 1. Get Supabase Management API Credentials

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to Account Settings → Access Tokens
3. Click "Generate new token"
4. Name it "StageSub Orchestra Provisioning"
5. Copy the token (starts with `sbp_`)

### 2. Get Your Organization ID

1. In Supabase Dashboard, go to your organization
2. Check the URL: `https://supabase.com/dashboard/org/[YOUR_ORG_ID]`
3. Copy the organization ID

### 3. Configure Environment Variables

Add these to your `.env.local`:

```env
# Supabase Management API
SUPABASE_MANAGEMENT_TOKEN=sbp_YOUR_TOKEN_HERE
SUPABASE_ORGANIZATION_ID=YOUR_ORG_ID_HERE

# Optional: Enable automatic provisioning in UI
NEXT_PUBLIC_USE_AUTOMATIC_PROVISIONING=true
```

## How It Works

### Automatic Flow

1. **Create Orchestra**: Admin creates new orchestra in superadmin panel
2. **Click "Skapa databas"**: System automatically:
   - Creates new Supabase project
   - Generates secure database password
   - Waits for project to be ready (2-3 minutes)
   - Configures connection strings
3. **Seed Data**: Initial templates and settings are created
4. **Ready to Use**: Orchestra can log in immediately

### Fallback to Pool

If Management API credentials are not configured, the system falls back to using pre-provisioned databases from the pool:

```env
DATABASE_URL_POOL_1=postgresql://...
DATABASE_URL_POOL_2=postgresql://...
```

## Migration Handling

Due to Edge Runtime limitations, database migrations cannot be run directly from the API. You have three options:

### Option 1: Manual Migration (Development)

```bash
# Run for specific database
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Option 2: Automated Script (Recommended)

Create a cron job or GitHub Action that:
1. Checks for new databases needing migration
2. Runs migrations automatically
3. Updates status when complete

### Option 3: Separate Migration Service

Deploy a Node.js service that handles migrations:

```javascript
// migration-service.js
app.post('/migrate', async (req, res) => {
  const { databaseUrl } = req.body
  execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`)
  res.json({ success: true })
})
```

## Cost Considerations

Each Supabase project costs:
- **Free tier**: 2 projects included
- **Pro plan**: $25/month per project
- **Team plan**: $25/month per project + collaboration features

Calculate your costs:
- 10 orchestras = $250/month
- 50 orchestras = $1,250/month
- 100 orchestras = $2,500/month

## Security Best Practices

1. **Token Security**:
   - Never commit Management API tokens
   - Rotate tokens regularly
   - Use environment variables only

2. **Database Passwords**:
   - Generated automatically (32 characters)
   - Mix of letters, numbers, special characters
   - Stored encrypted in database

3. **Access Control**:
   - Only superadmin can provision databases
   - Each orchestra isolated completely
   - No cross-database access possible

## Monitoring & Debugging

### Check Project Status

```javascript
const project = await supabaseManagement.getProject(projectId)
console.log('Status:', project.status)
// ACTIVE_HEALTHY, INACTIVE, PROVISIONING, RESTORING
```

### Common Issues

1. **"Rate limit exceeded"**
   - Management API allows 60 requests/minute
   - Implement retry logic with backoff

2. **"Project stuck in PROVISIONING"**
   - Usually takes 2-3 minutes
   - Max wait time: 10 minutes
   - Contact Supabase support if stuck

3. **"Cannot connect to database"**
   - Check if migrations were run
   - Verify connection string format
   - Ensure project is ACTIVE_HEALTHY

## Testing

### Test Automatic Provisioning

1. Set up Management API credentials
2. Create test orchestra: "Test Orchestra AB"
3. Click "Skapa databas"
4. Wait for completion (2-3 minutes)
5. Verify:
   - Database created in Supabase
   - Orchestra can log in
   - Data is isolated

### Test Pool Fallback

1. Remove Management API credentials
2. Add pool databases to env
3. Create orchestra
4. Verify pool assignment works

## Production Considerations

1. **Scaling**:
   - Consider database creation time (2-3 min)
   - Implement queue for bulk creation
   - Monitor Supabase quotas

2. **Backup Strategy**:
   - Each database backed up separately
   - Implement retention policies
   - Test restore procedures

3. **Monitoring**:
   - Track provisioning success rate
   - Alert on failures
   - Monitor database health

4. **Cost Optimization**:
   - Pause inactive databases
   - Implement usage-based billing
   - Consider volume discounts

## Future Enhancements

1. **One-Click Demo**:
   - Create temporary databases
   - Auto-cleanup after trial

2. **Template Databases**:
   - Pre-configured setups
   - Industry-specific templates

3. **Multi-Region**:
   - Deploy databases near customers
   - Automatic region selection

4. **Advanced Monitoring**:
   - Usage analytics per orchestra
   - Performance metrics
   - Cost tracking dashboard