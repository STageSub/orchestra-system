# Login Credentials for Orchestra System

## Neon Database Migration Complete! ✅

The system now uses 3 separate databases:
1. **Neon** - Main database (Orchestra & User tables)
2. **SCO Supabase** - SCO orchestra data only  
3. **SCOSO Supabase** - SCOSO orchestra data only

## Login Credentials

### Super Admin
- **Username**: superadmin
- **Password**: superadmin123
- **Access**: Can see all orchestras and switch between them

### SCO Admin
- **Username**: sco-admin
- **Password**: sco-admin123
- **Access**: Can only see SCO data from SCO database

### SCOSO Admin  
- **Username**: scosco-admin
- **Password**: BY%2z@RGq!%dk6v9
- **Access**: Can only see SCOSO data from SCOSO database

## Login URL
http://localhost:3001/admin/login

## Important Next Steps
1. Remove Orchestra & User tables from SCO database (Supabase)
2. Test that each user only sees their own orchestra's data
3. Verify database isolation is working correctly

## Database URLs (for reference)
- **Neon (Main)**: postgresql://neondb_owner:...@ep-morning-block-a9uuo9dm-pooler.gwc.azure.neon.tech/neondb
- **SCO**: postgresql://postgres.tckcuexsdzovsqaqiqkr:...@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
- **SCOSO**: postgresql://postgres.hqzrqnsvhyfypqklgoas:...@aws-0-eu-north-1.pooler.supabase.com:6543/postgres