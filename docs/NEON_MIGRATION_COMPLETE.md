# ✅ Neon Migration Slutförd!

## Vad vi har gjort:

### 1. **Exporterat data från gamla huvuddatabasen**
- Orchestra tabell (2 orkestrar)
- User tabell (3 användare)

### 2. **Satt upp Neon som ny huvuddatabas**
- URL: `postgresql://neondb_owner:...@ep-morning-block-a9uuo9dm-pooler.gwc.azure.neon.tech/neondb`
- Innehåller ENDAST Orchestra & User tabeller

### 3. **Nästa steg - Rensa SCO-databasen**

Gå till Supabase SQL Editor för SCO-projektet:
https://supabase.com/dashboard/project/tckcuexsdzovsqaqiqkr/sql/new

Kör detta SQL:
```sql
-- Ta bort tabeller som inte ska finnas här
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Orchestra" CASCADE;
```

## Resultat - 3 separata databaser:

### 1. **Neon (Huvuddatabas)**
```
Innehåller:
- Orchestra tabell (alla orkestrar)
- User tabell (alla användare)
```

### 2. **SCO Supabase**
```
Innehåller ENDAST:
- Musicians (SCO:s musiker)
- Projects (SCO:s projekt)
- Requests, Rankings, etc.
```

### 3. **SCOSO Supabase**
```
Innehåller ENDAST:
- Musicians (SCOSO:s musiker)
- Projects (SCOSO:s projekt)
- Requests, Rankings, etc.
```

## Test-instruktioner:

1. **Starta om servern**
   ```bash
   npm run dev
   ```

2. **Testa inloggning**
   - superadmin → Ser alla orkestrar (från Neon)
   - sco-admin → Ser bara SCO data (från SCO Supabase)
   - scosco-admin → Ser bara SCOSO data (från SCOSO Supabase)

## Fördelar med denna setup:

✅ **100% databasisolering** - Varje orkester har sin egen databas
✅ **Skalbart** - Lätt att lägga till fler orkestrar
✅ **Säkert** - Ingen risk för databas-delning
✅ **Gratis** - Neon för huvuddatabas, Supabase för orkestrar

## Om något går fel:

Vi har backup av all data i:
- `main-tables-export-1751554354027.json`

Kan alltid återställa om behövs!