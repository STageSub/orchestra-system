# Adding a New Orchestra - Practical Guide

This guide walks through the exact steps to add a new orchestra to the StageSub system.

## Prerequisites
- Access to Supabase to create new projects
- Access to the central database (Neon)
- Superadmin credentials

## Step 1: Create Orchestra Database (Supabase)

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Click "New project"
   - Name: `stagesub-[orchestra-code]` (e.g., `stagesub-rso`)
   - Generate a strong password
   - Region: Choose closest to orchestra location

2. **Get Connection String**
   - Go to Settings → Database
   - Copy the "Connection pooling" URL (not direct connection)
   - Should look like: `postgresql://postgres.xxxxx:password@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

3. **Save Credentials Securely**
   ```
   Orchestra: [Name]
   Code: [RSO]
   Database URL: [connection string]
   Created: [date]
   ```

## Step 2: Deploy Schema to New Database

1. **Update .env.local temporarily**
   ```bash
   DATABASE_URL_TEMP=[new-orchestra-connection-string]
   ```

2. **Generate Migration SQL**
   ```bash
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > orchestra-schema.sql
   ```

3. **Apply Schema**
   - Go to Supabase SQL Editor
   - Paste and run the generated SQL
   - Verify all tables are created

4. **Seed Basic Data**
   ```sql
   -- Add default instruments
   INSERT INTO "Instrument" (name, "displayOrder") VALUES
   ('Violin', 1),
   ('Viola', 2),
   ('Cello', 3),
   ('Kontrabas', 4),
   ('Flöjt', 5),
   ('Oboe', 6),
   ('Klarinett', 7),
   ('Fagott', 8),
   ('Valthorn', 9),
   ('Trumpet', 10),
   ('Trombon', 11),
   ('Tuba', 12),
   ('Slagverk', 13),
   ('Harpa', 14);

   -- Add email templates
   INSERT INTO "EmailTemplate" (type, subject, body) VALUES
   ('request', 'Förfrågan om vikariat - {{projectName}}', 'Hej {{firstName}}! ...'),
   ('reminder', 'Påminnelse: Vikariat - {{projectName}}', 'Hej {{firstName}}! ...'),
   ('confirmation', 'Bekräftelse - {{projectName}}', 'Hej {{firstName}}! ...');
   ```

## Step 3: Register Orchestra in Central Database

1. **Connect to Central Database**
   ```bash
   # Use your preferred PostgreSQL client
   psql [CENTRAL_DATABASE_URL]
   ```

2. **Insert Orchestra Record**
   ```sql
   INSERT INTO "Orchestra" (
     id,
     "orchestraId",
     name,
     subdomain,
     "contactName",
     "contactEmail",
     "databaseUrl",
     status,
     plan,
     "maxMusicians",
     "maxProjects",
     "pricePerMonth"
   ) VALUES (
     gen_random_uuid(),
     'RSO',  -- Unique orchestra code
     'Radiosymfoniorkestern',
     'rso',  -- Not used for routing but required
     'Admin Kontakt',
     'admin@rso.se',
     'postgresql://postgres.xxxxx:password@....', -- From step 1
     'active',
     'medium',
     200,
     20,
     4990
   ) RETURNING *;
   ```

3. **Verify Orchestra Added**
   ```sql
   SELECT "orchestraId", name, status FROM "Orchestra" 
   WHERE "orchestraId" = 'RSO';
   ```

## Step 4: Create Admin User

1. **Generate Password Hash**
   ```javascript
   // In Node.js or use online bcrypt generator
   const bcrypt = require('bcryptjs');
   const password = 'temporary-password-123';
   const hash = bcrypt.hashSync(password, 10);
   console.log(hash);
   ```

2. **Create User in Central Database**
   ```sql
   INSERT INTO "User" (
     id,
     username,
     email,
     "passwordHash",
     role,
     "orchestraId",
     active
   ) VALUES (
     gen_random_uuid(),
     'rso-admin',
     'admin@rso.se',
     '$2a$10$...', -- bcrypt hash from step 1
     'admin',
     (SELECT id FROM "Orchestra" WHERE "orchestraId" = 'RSO'),
     true
   ) RETURNING username, email;
   ```

## Step 5: Verify Setup

1. **Check Superadmin Dashboard**
   - Login as superadmin at https://stagesub.com/admin/login
   - Go to /superadmin
   - New orchestra should appear in the list
   - Check that metrics load (will be 0 initially)

2. **Test Orchestra Admin Login**
   - Logout from superadmin
   - Login with new orchestra admin credentials
   - Should land in orchestra admin dashboard
   - Verify can create musicians, projects, etc.

3. **Test Health Check**
   - In superadmin → Orkestrar tab
   - Check "Databashälsa" shows green checkmark
   - System status should show "Alla OK"

## Step 6: Production Setup

1. **Environment Variables (Vercel/Production)**
   ```bash
   DATABASE_URL_RSO=postgresql://postgres.xxxxx:password@....
   ```

2. **Update Documentation**
   - Add to internal orchestra list
   - Document any special requirements
   - Update billing records

3. **Inform Orchestra Admin**
   ```
   Subject: StageSub Orchestra System - Kontouppgifter

   Hej [Name],

   Ert StageSub-konto är nu aktiverat!

   Inloggning: https://stagesub.com/admin/login
   Användarnamn: [username]
   Temporärt lösenord: [password]

   Vänligen byt lösenord vid första inloggningen.

   Vid frågor, kontakta support@stagesub.com

   Med vänliga hälsningar,
   StageSub Team
   ```

## Troubleshooting

### Orchestra Not Showing in Superadmin
- Check Orchestra status is 'active'
- Verify databaseUrl is correct
- Check for typos in orchestraId

### Cannot Connect to Orchestra Database
- Verify connection string is pooler URL (not direct)
- Check password is properly URL-encoded
- Test connection with psql directly

### User Cannot Login
- Verify orchestraId in User table matches Orchestra.id
- Check password hash is correct
- Ensure user.active = true

### No Metrics Showing
- Check tables exist in orchestra database
- Verify SystemLog table has correct schema
- Look for errors in browser console

## Rollback Procedure

If something goes wrong:

1. **Remove from Central Database**
   ```sql
   DELETE FROM "User" WHERE "orchestraId" = 
     (SELECT id FROM "Orchestra" WHERE "orchestraId" = 'RSO');
   DELETE FROM "Orchestra" WHERE "orchestraId" = 'RSO';
   ```

2. **Delete Supabase Project** (if needed)
   - Go to Supabase dashboard
   - Project settings → Delete project

## Best Practices

1. **Always test locally first** with DATABASE_URL_TEMP
2. **Use strong passwords** for database and admin user
3. **Document everything** including special requirements
4. **Backup central database** before adding new orchestras
5. **Monitor first 24 hours** for any issues

## Security Checklist

- [ ] Database password is strong and unique
- [ ] Admin password is temporary and must be changed
- [ ] Connection string uses pooler (not direct)
- [ ] SSL is enabled (should be automatic)
- [ ] No credentials committed to git
- [ ] Environment variables set in production
- [ ] Access logged in SystemLog