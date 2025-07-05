# Production Database Fix

## Problem
Produktionsdatabasen (Neon) saknar vissa kolumner som finns i Prisma-schemat, vilket orsakar fel i superadmin dashboard.

## Lösning

### Steg 1: Kör schema-migrationen
1. Logga in på Neon Dashboard: https://console.neon.tech/
2. Välj din databas
3. Gå till SQL Editor
4. Kopiera och kör innehållet från `manual_add_orchestra_columns.sql`

### Steg 2: Uppdatera superadmin användaren
1. I samma SQL Editor
2. Kopiera och kör innehållet från `manual_update_superadmin.sql`

### Steg 3: Verifiera
Efter att ha kört båda SQL-scripts:
1. Gå till https://stagesub.com/superadmin
2. Logga in med:
   - Username: `superadmin`
   - Password: `admin123`
3. Alla data ska nu visas korrekt

## Viktig information
- Dessa migrations behöver endast köras EN gång i produktion
- De innehåller `IF NOT EXISTS` checks så de är säkra att köra flera gånger
- Efter detta bör du köra `npx prisma migrate deploy` för framtida migrations