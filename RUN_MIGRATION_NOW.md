# 🚨 VIKTIGT: Kör Multi-Tenant Migrering

Du måste köra SQL-migreringen för att skapa Tenant och User tabellerna!

## Steg 1: Öppna Supabase Dashboard

1. Gå till din Supabase dashboard
2. Klicka på "SQL Editor" i sidomenyn

## Steg 2: Kör Migreringen

1. Öppna filen: `/prisma/migrations/manual/add_multi_tenant_schema.sql`
2. Kopiera HELA innehållet
3. Klistra in i Supabase SQL Editor
4. Klicka på "Run" (eller tryck Cmd/Ctrl + Enter)

## Steg 3: Verifiera

Migreringen skapar:
- `Tenant` tabell
- `User` tabell 
- Lägger till `tenantId` på alla befintliga tabeller
- Skapar en default tenant
- Migrerar all befintlig data till default tenant

## Efter Migreringen

Kör dessa kommandon för att skapa användare:

```bash
# Skapa superadmin
npx ts-node scripts/create-superadmin.ts

# Skapa vanlig admin
npx ts-node scripts/create-admin-user.ts
```

## Inloggningsuppgifter

Efter att du kört skripten kan du logga in med:

### Superadmin (för /superadmin)
- Email: superadmin@stagesub.com
- Lösenord: superadmin123

### Admin (för /admin)
- Email: admin@orchestra.local
- Lösenord: orchestra123

### Legacy Login
- Lösenord: orchestra123 (använder ADMIN_PASSWORD från .env)

## Felsökning

Om du får fel:
1. Kontrollera att migreringen körts korrekt
2. Kolla att alla tabeller skapats
3. Verifiera att `default-tenant` finns i Tenant-tabellen