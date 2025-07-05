# StageSub Orchestra System Architecture

## Overview

StageSub Orchestra System is a multi-tenant SaaS platform where multiple orchestras can manage their musicians, projects, and substitute requests. The system uses a hybrid database architecture with complete data isolation between orchestras.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      stagesub.com                           │
│                  (Single Entry Point)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Central Database                          │
│                      (Neon)                                 │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Orchestra   │  │    User     │  │   SystemLog      │  │
│  │   Table     │  │   Table     │  │   (Central)      │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
│                                                             │
│  Stores:                                                    │
│  - Orchestra metadata (name, ID, database URL)             │
│  - User accounts and authentication                        │
│  - Orchestra-to-database routing                           │
└────────────┬────────────────────────┬──────────────────────┘
             │                        │
             ▼                        ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│   SCO Database          │  │   SCOSO Database        │
│   (Supabase)           │  │   (Supabase)           │
│                        │  │                        │
│  - Musicians           │  │  - Musicians           │
│  - Projects            │  │  - Projects            │
│  - Requests            │  │  - Requests            │
│  - Rankings            │  │  - Rankings            │
│  - SystemLog (Local)   │  │  - SystemLog (Local)   │
│  - All orchestra data  │  │  - All orchestra data  │
└────────────────────────┘  └────────────────────────┘
```

## 🔐 Authentication & Access Control

### No Subdomain Routing
- **All users login at**: `https://stagesub.com/admin/login`
- **NOT**: `sco.stagesub.com` or `scoso.stagesub.com`
- The system uses user credentials to determine orchestra access

### Login Flow
1. User enters username/password at `stagesub.com/admin/login`
2. System checks credentials against User table in central database
3. User record contains `orchestraId` which links to Orchestra table
4. Orchestra table contains `databaseUrl` for the specific orchestra database
5. System routes all subsequent queries to the correct orchestra database

### User Roles
- **superadmin**: Access to all orchestras and superadmin dashboard
- **admin**: Full access to their assigned orchestra only
- **user**: Limited access within their orchestra
- **musician**: No login, only responds to email requests

## 💾 Database Structure

### Central Database (Neon)
Located at: `DATABASE_URL` environment variable

**Tables:**
- **Orchestra**: Registry of all orchestras
  ```sql
  - id (unique identifier)
  - orchestraId (e.g., "SCO", "SCOSO")
  - name (e.g., "SCO Admin")
  - subdomain (legacy field, not used for routing)
  - databaseUrl (connection string to orchestra database)
  - status (active/inactive/suspended)
  - plan (small/medium/enterprise)
  - maxMusicians, maxProjects (subscription limits)
  ```

- **User**: All user accounts across all orchestras
  ```sql
  - id, username, email, passwordHash
  - role (superadmin/admin/user)
  - orchestraId (links to Orchestra table)
  - active, lastLogin
  ```

### Orchestra Databases (Supabase)
Each orchestra has its own complete database with:

**Tables:**
- Musician (all musicians for this orchestra)
- Project (concerts and productions)
- ProjectNeed (positions needed for projects)
- Request (substitute requests sent)
- RankingList (A/B/C lists)
- Instrument, Position
- SystemLog (orchestra-specific logs)
- EmailTemplate
- Settings

**Complete Data Isolation:**
- No shared tables between orchestras
- No foreign keys across databases
- Each orchestra's data is completely separate

## 🆕 Adding New Orchestras

### Step-by-Step Process

1. **Create New Database** (Supabase)
   ```bash
   # Create new Supabase project
   # Get connection string (pooler URL)
   # Example: postgresql://postgres.xxxxx:password@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
   ```

2. **Run Schema Migration**
   ```bash
   # Apply the schema from prisma/schema.prisma
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```

3. **Add to Central Database**
   ```sql
   INSERT INTO "Orchestra" (
     id, orchestraId, name, subdomain, 
     databaseUrl, status, plan, 
     maxMusicians, maxProjects, pricePerMonth
   ) VALUES (
     'generated-uuid',
     'NEWORCH',
     'New Orchestra Name',
     'neworch',  -- not used for routing
     'postgresql://...',  -- Supabase connection string
     'active',
     'medium',
     200,
     20,
     4990
   );
   ```

4. **Create Admin User**
   ```sql
   INSERT INTO "User" (
     id, username, email, passwordHash,
     role, orchestraId, active
   ) VALUES (
     'generated-uuid',
     'neworch-admin',
     'admin@neworchestra.com',
     '$2a$10$...',  -- bcrypt hashed password
     'admin',
     'orchestra-id-from-step-3',
     true
   );
   ```

5. **Initialize Orchestra Data**
   - Seed default instruments
   - Create email templates
   - Set default settings

### Automatic Superadmin Visibility
Once added to the Orchestra table with status='active':
- Appears in superadmin dashboard automatically
- Metrics are fetched from the orchestra database
- Health monitoring includes the new orchestra
- Can be managed like existing orchestras

## 🔄 System Communication Flow

### Regular User Flow
```
1. Login at stagesub.com
   ↓
2. Authenticate against central DB
   ↓
3. Get orchestraId from User record
   ↓
4. Lookup databaseUrl from Orchestra table
   ↓
5. All subsequent queries go to orchestra DB
```

### Superadmin Flow
```
1. Login at stagesub.com (with superadmin role)
   ↓
2. Access /superadmin dashboard
   ↓
3. Metrics API queries central DB for orchestra list
   ↓
4. For each orchestra:
   - Connect to orchestra DB using databaseUrl
   - Fetch metrics (musicians, projects, etc.)
   - Aggregate results
   ↓
5. Display combined view of all orchestras
```

## 🛡️ Security Considerations

1. **Database Isolation**
   - Each orchestra can only access its own database
   - No cross-database queries possible
   - Complete data privacy between orchestras

2. **Connection Security**
   - All database URLs use SSL
   - Passwords are URL-encoded
   - Connection pooling for performance

3. **Access Control**
   - JWT tokens contain orchestraId
   - Middleware validates orchestra access
   - Superadmin bypasses orchestra checks

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Central database (Neon)
DATABASE_URL=postgresql://neondb_owner:xxx@xxx.neon.tech/neondb

# Orchestra databases (for local testing)
DATABASE_URL_SCO=postgresql://postgres.xxx:xxx@supabase.com/postgres
DATABASE_URL_SCOSO=postgresql://postgres.yyy:yyy@supabase.com/postgres

# Authentication
JWT_SECRET=your-secret-key
```

### Adding Production Orchestra
1. Never commit database URLs to git
2. Use environment variables in production
3. Store credentials securely (e.g., Vercel env vars)
4. Test connection before going live

## 📊 Monitoring & Maintenance

### Health Checks
- `/api/superadmin/health` monitors all databases
- Checks connection to each orchestra
- Reports unhealthy databases

### Logs
- Central SystemLog for authentication and routing
- Orchestra SystemLog for orchestra-specific events
- Superadmin can view logs from all orchestras

### Backups
- Each database should have independent backups
- Central database is critical (contains routing)
- Orchestra databases can be restored independently

## 🔮 Future Enhancements

1. **Dynamic Provisioning**
   - API to create new orchestras automatically
   - Terraform/IaC for database creation
   - Automated schema deployment

2. **Migration Tools**
   - Bulk migration runner for all orchestras
   - Version tracking per orchestra
   - Rollback capabilities

3. **Advanced Monitoring**
   - Real-time connection pool monitoring
   - Performance metrics per orchestra
   - Automatic failover for unhealthy databases

## 💡 Key Takeaways

1. **Single Entry Point**: All access through stagesub.com
2. **No Subdomains**: User credentials determine orchestra, not URL
3. **Complete Isolation**: Each orchestra's data is separate
4. **Central Registry**: Orchestra table is the routing source of truth
5. **Scalable**: New orchestras just need a database and registry entry