# Separate Database Architecture

## Overview

StageSub uses a separate database architecture where each customer (orchestra) has their own completely isolated PostgreSQL database. This provides:

- **Complete data isolation** - No risk of data leakage between customers
- **Simple architecture** - No complex filtering or middleware needed
- **Better performance** - Each database can be optimized independently
- **Easy backups** - Backup/restore per customer
- **Compliance** - Meets data residency requirements

## How It Works

### 1. Subdomain Routing
Each customer accesses their system via a unique subdomain:
- `goteborg.stagesub.com` → Göteborg Orchestra database
- `malmo.stagesub.com` → Malmö Orchestra database
- `stockholm.stagesub.com` → Stockholm Orchestra database

### 2. Database Selection
The middleware extracts the subdomain from the request and selects the appropriate database:

```typescript
// middleware.ts
const subdomain = getSubdomain(hostname) // e.g., "goteborg"
const databaseUrl = DATABASE_URLS[subdomain] // Gets Göteborg's database URL
```

### 3. Prisma Client Management
Each subdomain gets its own Prisma client instance that connects to their specific database:

```typescript
// lib/database-config.ts
const prisma = getPrismaClient('goteborg') // Returns Göteborg's Prisma client
```

## Setup New Customer

### 1. Create Database
Create a new PostgreSQL database for the customer:

```sql
CREATE DATABASE orchestra_customerName;
```

### 2. Add Environment Variable
Add the database URL to `.env.local`:

```env
DATABASE_URL_CUSTOMERNAME=postgresql://user:pass@host/orchestra_customerName
```

### 3. Update Configuration
Add the customer to `lib/database-config.ts`:

```typescript
const DATABASE_URLS: Record<string, string> = {
  // ... existing customers
  'customername': process.env.DATABASE_URL_CUSTOMERNAME!,
}
```

### 4. Run Setup Script
Use the setup script to initialize the database:

```bash
npm run setup-customer
```

### 5. Configure DNS
Point the subdomain to your server:
```
customername.stagesub.com → your-server-ip
```

## Superadmin Dashboard

The superadmin dashboard (`admin.stagesub.com`) can query all customer databases to show:
- Total customers
- Total musicians across all customers
- Total projects across all customers
- Customer activity and status
- Direct links to each customer's admin panel

## Benefits vs Multi-Tenant

| Feature | Separate Databases | Multi-Tenant |
|---------|-------------------|--------------|
| Data Isolation | ✅ Complete | ⚠️ Depends on implementation |
| Performance | ✅ Independent scaling | ⚠️ Shared resources |
| Complexity | ✅ Simple | ❌ Complex filtering |
| Backup/Restore | ✅ Per customer | ❌ All or nothing |
| Cost | ❌ Higher (multiple DBs) | ✅ Lower (shared DB) |
| Debugging | ✅ Easy | ❌ Complex |

## Security Considerations

1. **Database Credentials**: Each database has its own credentials
2. **Network Security**: Databases should only accept connections from the application server
3. **Backup Encryption**: Each customer's backups should be encrypted separately
4. **Access Control**: Superadmin is the only role that can access multiple databases

## Scaling Considerations

1. **Vertical Scaling**: Each database can be scaled independently
2. **Geographic Distribution**: Databases can be located near customers
3. **Connection Pooling**: Use PgBouncer for large numbers of customers
4. **Monitoring**: Monitor each database separately

## Migration from Single Database

If migrating from a single database:

1. Export each customer's data
2. Create new databases
3. Import data into respective databases
4. Update DNS and configuration
5. Test thoroughly before switching

## Troubleshooting

### Customer can't access their system
1. Check DNS is configured correctly
2. Verify database URL in environment variables
3. Check database is accessible
4. Review middleware logs for subdomain extraction

### Superadmin stats are slow
1. Consider caching stats
2. Run queries in parallel
3. Add database indexes
4. Limit time range for queries