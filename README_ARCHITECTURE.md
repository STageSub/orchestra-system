# StageSub Architecture - Separate Databases

## Overview

StageSub uses a **separate database architecture** where each customer (orchestra) has their own isolated PostgreSQL database. This is a simpler, more secure approach compared to complex multi-tenant architectures.

## Key Benefits

✅ **Zero data leakage risk** - Complete isolation between customers  
✅ **Simple to debug** - No complex filtering or middleware  
✅ **Better performance** - Each database scales independently  
✅ **Easy backups** - Backup/restore per customer  
✅ **Compliance ready** - Data residency requirements easily met  

## How It Works

### Customer Access
Each customer accesses their system via a unique subdomain:
- `goteborg.stagesub.com` → Göteborg's database
- `malmo.stagesub.com` → Malmö's database  
- `stockholm.stagesub.com` → Stockholm's database

### Superadmin Access
Superadmins access a special dashboard at `admin.stagesub.com` that can:
- View all customers
- See aggregated statistics
- Access any customer's admin panel
- Manage customer databases

## Quick Start

### 1. Set Environment Variables
```env
# Default database (for development)
DATABASE_URL=postgresql://...

# Customer databases
DATABASE_URL_GOTEBORG=postgresql://...
DATABASE_URL_MALMO=postgresql://...
```

### 2. Add Customer to Config
Edit `lib/database-config.ts`:
```typescript
const DATABASE_URLS = {
  'goteborg': process.env.DATABASE_URL_GOTEBORG!,
  'malmo': process.env.DATABASE_URL_MALMO!,
  // Add new customer here
}
```

### 3. Run Migrations
```bash
DATABASE_URL=postgresql://... npx prisma migrate deploy
```

### 4. Configure DNS
Point subdomain to your server:
```
customername.stagesub.com → your-server-ip
```

## Login

### Customer Admin
1. Go to `https://customername.stagesub.com/admin`
2. Select "Admin" login type
3. Use customer's admin password

### Superadmin
1. Go to `https://admin.stagesub.com/admin`  
2. Select "Superadmin" login type
3. Use superadmin password

## Architecture Details

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Göteborg DB   │     │    Malmö DB     │     │  Stockholm DB   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                          ┌──────┴──────┐
                          │  Next.js    │
                          │ Application │
                          └──────┬──────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
┌────────┴────────┐                             ┌────────┴────────┐
│  Customer URLs  │                             │ Superadmin URL  │
│ *.stagesub.com  │                             │admin.stagesub.com│
└─────────────────┘                             └─────────────────┘
```

## Adding New Customers

Use the setup script:
```bash
npm run setup-customer
```

Or manually:
1. Create PostgreSQL database
2. Add DATABASE_URL_CUSTOMERNAME to .env
3. Update lib/database-config.ts
4. Run migrations
5. Configure DNS

## Security

- Each database has separate credentials
- Customers cannot access other databases
- Only superadmin can query multiple databases
- All connections use SSL

## Comparison to Multi-Tenant

| Feature | Our Approach | Multi-Tenant |
|---------|--------------|--------------|
| Data Isolation | ✅ Complete | ⚠️ Complex |
| Performance | ✅ Independent | ⚠️ Shared |
| Debugging | ✅ Easy | ❌ Hard |
| Cost | ❌ Higher | ✅ Lower |

## Questions?

See `/docs/SEPARATE_DATABASE_ARCHITECTURE.md` for detailed documentation.