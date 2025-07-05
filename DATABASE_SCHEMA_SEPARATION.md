# Database Schema Separation - CRITICAL FIX

## Issue Discovered (2025-07-05)

The system was using a single `schema.prisma` file for both central (Neon) and orchestra (Supabase) databases. This caused all tables to be created in both database types, violating the intended architecture.

### What Went Wrong
1. **Single Schema File**: Both database types used the same schema, creating all tables everywhere
2. **Neon Had Orchestra Tables**: Tables like Musician, Project, etc. were created in the central database
3. **Data Isolation Risk**: Though no actual data leakage occurred, the architecture was incorrect

### What Was Fixed

#### 1. Restored Central Database
- Restored Orchestra and User tables from backup (`main-tables-export-1751554354027.json`)
- SCO and SCOSO orchestras now properly configured
- Superadmin and admin users restored with correct passwords

#### 2. Created Separate Schema Files
- **`prisma/schema.central.prisma`**: Only contains Orchestra, User, Customer, SystemLog tables
- **`prisma/schema.orchestra.prisma`**: Contains all orchestra-specific tables

#### 3. Cleaned Neon Database
- Removed 21 orchestra-specific tables that shouldn't exist in central database
- Neon now only has the 4 tables it should have

#### 4. Verified Orchestra Databases
- SCO database: 163 musicians, 45 projects - ✅ Intact
- SCOSO database: 5 musicians, 7 projects - ✅ Intact

## New Architecture

### Central Database (Neon)
- **Purpose**: Superadmin functionality only
- **Tables**: Orchestra, User, Customer, SystemLog
- **Schema**: `prisma/schema.central.prisma`
- **Connection**: Uses `CENTRAL_DATABASE_URL` environment variable

### Orchestra Databases (Supabase)
- **Purpose**: All orchestra-specific data
- **Tables**: Musician, Project, Instrument, Position, etc. (21 tables)
- **Schema**: `prisma/schema.orchestra.prisma`
- **Connection**: Uses `DATABASE_URL` or orchestra-specific URLs

## How to Use Going Forward

### For Central Database Operations
```bash
npx prisma generate --schema=prisma/schema.central.prisma
npx prisma db push --schema=prisma/schema.central.prisma
```

### For Orchestra Database Operations
```bash
npx prisma generate --schema=prisma/schema.orchestra.prisma
npx prisma db push --schema=prisma/schema.orchestra.prisma
```

### In Code
```typescript
// For central database operations
import { PrismaClient } from '.prisma/client-central'

// For orchestra database operations
import { PrismaClient } from '.prisma/client-orchestra'
```

## Prevention

1. **Never use the old `schema.prisma`** - It creates tables in wrong places
2. **Always specify which schema** when running Prisma commands
3. **Use correct imports** based on which database you're accessing

## Scripts Created

- `scripts/restore-neon-data.ts` - Restores central database data
- `scripts/clean-neon-database.ts` - Removes orchestra tables from Neon
- `scripts/verify-orchestra-databases.ts` - Verifies orchestra databases are intact
- `scripts/check-neon-tables.ts` - Lists tables and identifies issues

## Status

✅ **FIXED** - The database architecture is now correctly separated