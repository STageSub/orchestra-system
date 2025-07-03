# Testing New Orchestra Setup

## Option 1: Automatic Database Creation (Recommended)

### Prerequisites

1. Get Supabase Management API token from https://supabase.com/dashboard/account/tokens
2. Get your Organization ID from Supabase dashboard URL

### Step 1: Configure Environment

Add to your `.env.local`:

```env
# Supabase Management API
SUPABASE_MANAGEMENT_TOKEN=sbp_YOUR_TOKEN_HERE
SUPABASE_ORGANIZATION_ID=YOUR_ORG_ID_HERE
```

### Step 2: Create and Provision Orchestra

1. Go to http://localhost:3001/superadmin
2. Click "Orkestrar" tab
3. Click "Skapa ny orkester"
4. Fill in details and submit
5. Click "Skapa databas" - this will automatically:
   - Create a new Supabase project
   - Generate secure credentials
   - Wait for database to be ready (2-3 minutes)
   - Seed initial data

### Step 3: Run Migrations

Since Edge Runtime can't run migrations, do one of:

```bash
# Option A: Run manually after creation
DATABASE_URL="[shown-in-logs]" npx prisma migrate deploy

# Option B: Use the setup script
npm run setup-orchestra "[database-url]" "Orchestra Name" "subdomain"
```

## Option 2: Manual Database Pool

### Prerequisites

1. Create a second database in Supabase manually
2. Get the pooler connection URL from Supabase

## Step 1: Configure Environment

Add the new database to your `.env.local`:

```env
# Your existing main database
DATABASE_URL=postgresql://postgres.tckcuexsdzovsqaqiqkr:Kurdistan12@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Pool databases for new orchestras
DATABASE_URL_POOL_1=postgresql://[YOUR_NEW_DATABASE_URL]
```

Replace `[YOUR_NEW_DATABASE_URL]` with the actual pooler connection URL from your second Supabase database.

## Step 2: Run Migrations on New Database

Before using the UI, you need to run migrations on the new database:

```bash
# Set the DATABASE_URL to your new database temporarily
export DATABASE_URL="postgresql://[YOUR_NEW_DATABASE_URL]"

# Run migrations
npx prisma migrate deploy

# Reset DATABASE_URL back to main database
unset DATABASE_URL
```

## Step 3: Start the Application

```bash
npm run dev
```

## Step 4: Create Orchestra via UI

1. Go to http://localhost:3001/superadmin
2. Click on "Orkestrar" tab
3. Click "Skapa ny orkester"
4. Fill in:
   - Name: "Malmö Symfoniorkester"
   - Subdomain: "malmo"
   - Contact: "Test Person"
   - Email: "test@malmo.se"
5. Submit the form

## Step 5: Provision the Database

1. In the orchestra list, find "Malmö Symfoniorkester"
2. Click "Provisionera databas"
3. Wait for the process to complete
4. You should see status change to "Provisionerad"

## Step 6: Test the New Orchestra

1. Add subdomain to your hosts file (for local testing):
   ```
   127.0.0.1 malmo.localhost
   ```

2. Visit http://malmo.localhost:3001
3. You should see the landing page
4. Try to access http://malmo.localhost:3001/admin
5. Log in with your admin credentials

## Step 7: Verify Data Isolation

1. Create a musician in the Malmö orchestra
2. Go back to the main orchestra (localhost:3001)
3. Verify that the musician doesn't appear there
4. This confirms data isolation is working

## Troubleshooting

### "No databases available in pool"
- Make sure DATABASE_URL_POOL_1 is set in .env.local
- Restart the dev server after adding environment variables

### "Failed to seed database"
- Check that migrations were run on the new database
- Verify the database URL is correct
- Check console logs for specific errors

### Subdomain not routing correctly
- For production: Configure DNS
- For local: Use hosts file or test with localhost subdomain routing

## What Gets Created

When provisioning succeeds, the following is created in the new database:

1. **Email Templates**:
   - Request template (Swedish)
   - Reminder template
   - Confirmation template
   - Position filled template

2. **System Settings**:
   - Default language: Swedish
   - Timezone: Europe/Stockholm
   - Response time: 48 hours
   - Email from: Orchestra name

3. **Ready for Use**:
   - Admin can start adding musicians
   - Create instruments and positions
   - Set up ranking lists
   - Create projects

## Next Steps

After successful testing:

1. Document the new orchestra setup
2. Configure production DNS if needed
3. Share admin credentials with the orchestra
4. Monitor initial usage
5. Provide support during onboarding