# Adding New Orchestra Guide

## Overview
This guide explains how to properly add a new orchestra to the StageSub system.

## Prerequisites
- Superadmin access
- Database URLs for the new orchestra (Supabase/Neon)

## Step 1: Create Orchestra Database
1. Create a new database in Supabase for the orchestra
2. Get the connection string (pooler URL recommended)
3. Run the orchestra schema setup:
   ```bash
   npm run setup-orchestra -- --url "YOUR_DATABASE_URL"
   ```

## Step 2: Add Orchestra via API or Script

### Option A: Using a Script (Recommended)
Create a script like this:

```javascript
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function addOrchestra() {
  // 1. Create the orchestra
  const orchestra = await prisma.orchestra.create({
    data: {
      orchestraId: 'UNI',  // 3-letter code
      name: 'Universitetsorkestern',
      subdomain: 'uni',  // Not used but required
      contactName: 'Admin',
      contactEmail: 'admin@uni.se',
      databaseUrl: 'postgresql://...',  // Your Supabase URL
      status: 'active',
      plan: 'medium',
      maxMusicians: 200,
      maxProjects: 20,
      pricePerMonth: 4990
    }
  })
  
  // 2. Create admin user for the orchestra
  const passwordHash = await bcrypt.hash('Orchestra123!', 10)
  const user = await prisma.user.create({
    data: {
      username: 'uni-admin',
      email: 'uni-admin@stagesub.com',
      passwordHash,
      role: 'admin',
      orchestraId: orchestra.id,
      active: true
    }
  })
  
  console.log('Orchestra created:', orchestra.name)
  console.log('Admin user created:', user.username)
}
```

### Option B: Via Superadmin Dashboard (Coming Soon)
The "Ny orkester" button in superadmin dashboard will handle this automatically.

## Step 3: Verify Setup
1. Login to superadmin dashboard
2. Check that the orchestra appears in the list
3. Test login with the orchestra admin credentials
4. Verify data isolation is working

## Important Fields

### Orchestra Fields
- **orchestraId**: Unique 3-letter code (e.g., 'SCO', 'GOT')
- **name**: Full orchestra name
- **databaseUrl**: Connection string to orchestra's database
- **plan**: 'small', 'medium', or 'enterprise'
- **status**: 'active', 'inactive', or 'suspended'

### Subscription Limits
- **Small** ($79): 50 musicians, 5 projects, 10 instruments
- **Medium** ($499): 200 musicians, 20 projects, unlimited instruments  
- **Enterprise** ($1500): Unlimited everything

## Troubleshooting

### Missing columns error
If you get "column does not exist" errors:
1. Check that all migrations have been run
2. Use the production migration script in `/prisma/migrations/`

### Authentication issues
1. Ensure user has correct orchestraId
2. Password must be hashed with bcrypt
3. User must be active = true

### Data not showing
1. Check DATABASE_URL points to Neon (central database)
2. Orchestra must have valid databaseUrl
3. Run test queries to verify connections