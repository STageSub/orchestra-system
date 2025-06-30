# Prisma-Supabase Synkroniseringsguide

## 🚨 VIKTIGT: Läs detta INNAN du lägger till nya fält!

Detta dokument beskriver hur man säkerställer att Prisma-schemat och Supabase-databasen förblir synkroniserade. Detta är ett återkommande problem som orsakar 500-fel i produktion.

## Problemet

När vi lägger till nya fält i Prisma-schemat:
1. Prisma genererar en migration lokalt
2. Koden förväntar sig att fältet finns
3. **MEN** Supabase-databasen uppdateras INTE automatiskt
4. Resultat: 500-fel med "Unknown argument" eller "column does not exist"

## Symptom

```
Error fetching musicians: PrismaClientKnownRequestError:
Invalid prisma.musician.findMany() invocation:
Unknown argument preferredLanguage. Available options are marked with ?.
```

## Lösning - Steg för steg

### 1. När du lägger till ett nytt fält i schema.prisma

```prisma
model Musician {
  // ... existing fields
  preferredLanguage String? @default("sv")  // NYTT FÄLT
}
```

### 2. Generera Prisma-migration lokalt

```bash
npx prisma migrate dev --name add_preferred_language
```

### 3. KRITISKT: Skapa manuell SQL för Supabase

Skapa fil: `/prisma/migrations/manual_add_[field_name].sql`

```sql
-- Manual migration for Supabase
-- Run this in Supabase SQL Editor

ALTER TABLE "Musician" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'sv';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Musician' AND column_name = 'preferredLanguage';
```

### 4. Kör SQL i Supabase

1. Gå till Supabase Dashboard
2. SQL Editor
3. Klistra in och kör SQL-koden
4. Verifiera att kolumnen lades till

### 5. Testa i utvecklingsmiljön

```bash
npm run dev
# Testa funktionaliteten som använder det nya fältet
```

## Vanliga fält och deras SQL

### Text/String fält
```sql
ALTER TABLE "TableName" ADD COLUMN "fieldName" TEXT;
ALTER TABLE "TableName" ADD COLUMN "fieldName" TEXT DEFAULT 'defaultValue';
ALTER TABLE "TableName" ADD COLUMN "fieldName" TEXT NOT NULL DEFAULT 'defaultValue';
```

### Boolean fält
```sql
ALTER TABLE "TableName" ADD COLUMN "fieldName" BOOLEAN DEFAULT false;
ALTER TABLE "TableName" ADD COLUMN "fieldName" BOOLEAN NOT NULL DEFAULT true;
```

### Integer fält
```sql
ALTER TABLE "TableName" ADD COLUMN "fieldName" INTEGER;
ALTER TABLE "TableName" ADD COLUMN "fieldName" INTEGER DEFAULT 0;
ALTER TABLE "TableName" ADD COLUMN "fieldName" INTEGER NOT NULL DEFAULT 0;
```

### DateTime fält
```sql
ALTER TABLE "TableName" ADD COLUMN "fieldName" TIMESTAMP;
ALTER TABLE "TableName" ADD COLUMN "fieldName" TIMESTAMP DEFAULT NOW();
```

### JSON fält
```sql
ALTER TABLE "TableName" ADD COLUMN "fieldName" JSONB;
ALTER TABLE "TableName" ADD COLUMN "fieldName" JSONB DEFAULT '[]'::jsonb;
```

## Checklist för nya fält

- [ ] Fält tillagt i schema.prisma
- [ ] Lokal migration genererad med `prisma migrate dev`
- [ ] Manuell SQL-fil skapad i `/prisma/migrations/manual_*.sql`
- [ ] SQL körd i Supabase Dashboard
- [ ] Verifierat att kolumnen finns i Supabase
- [ ] Testat funktionaliteten lokalt
- [ ] Dokumenterat i relevanta filer (IMPLEMENTATION_STATUS.md, etc.)

## Felsökning

### "Unknown argument" fel
- Kolumnen saknas i Supabase
- Lösning: Kör manuell SQL-migration

### "column does not exist" fel
- Samma som ovan, men från databas-perspektiv
- Lösning: Kör manuell SQL-migration

### Prisma Client inte uppdaterad
```bash
npx prisma generate
npm run dev
```

### Camelcase vs snake_case problem
- Prisma använder camelCase: `preferredLanguage`
- PostgreSQL kan vara känslig för detta
- Använd alltid quotes i SQL: `"preferredLanguage"`

## Tidigare problem (för referens)

1. **preferredLanguage** (2025-06-30)
   - Lagt till för flerspråkigt e-poststöd
   - SQL: `ALTER TABLE "Musician" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'sv';`

2. **requireLocalResidence** (2025-06-28)
   - Lagt till för lokalt boende-filter
   - SQL: `ALTER TABLE "ProjectNeed" ADD COLUMN "requireLocalResidence" BOOLEAN DEFAULT false;`

3. **originalFileName & mimeType** (2025-06-27)
   - Lagt till för filhantering
   - SQL: 
     ```sql
     ALTER TABLE "ProjectFile" ADD COLUMN "originalFileName" TEXT;
     ALTER TABLE "ProjectFile" ADD COLUMN "mimeType" TEXT;
     ```

## Automatisering (Framtida förbättring)

För att undvika detta problem helt kan vi:
1. Använda Prisma Migrate deploy i CI/CD
2. Skapa ett script som synkar Supabase automatiskt
3. Använda Supabase Migrations istället för Prisma Migrations

Men tills dess - **FÖLJ ALLTID DENNA GUIDE!**