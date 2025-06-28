# 🛠️ Troubleshooting & Lösningar

Detta dokument uppdateras löpande när vi stöter på problem och hittar lösningar.

## 📋 Innehåll

- [Setup-problem](#setup-problem)
- [Databasproblem](#databasproblem)
- [UI/UX-problem](#uiux-problem)
- [Prestandaproblem](#prestandaproblem)

---

## Setup-problem

### Problem: Tailwind CSS v4 stöds inte av shadcn/ui
**Datum**: 2024-12-25  
**Symptom**: Fel vid installation av shadcn/ui  
**Lösning**: Använd manuella UI-komponenter med Tailwind CSS direkt tills shadcn stödjer v4

---

## Databasproblem

### Problem: Databas-DNS fungerar inte - använder pooler temporärt
**Datum**: 2025-06-26  
**Symptom**: `Can't reach database server at db.tckcuexsdzovsqaqiqkr.supabase.co:5432`  
**Orsak**: DNS för direkt databas-anslutning löser inte korrekt  
**Temporär lösning**: Använder pooler connection istället
```bash
# Fungerar inte (direkt - lägre latens)
postgresql://postgres:Kurdistan12@db.tckcuexsdzovsqaqiqkr.supabase.co:5432/postgres

# Fungerar (pooler - högre latens ~300-900ms)
postgresql://postgres.tckcuexsdzovsqaqiqkr:Kurdistan12@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
**TODO**: Byt tillbaka till direkt anslutning när DNS-problemet är löst för bättre prestanda

### Problem: Prisma-migrering kräver databas-anslutning
**Datum**: 2024-12-25  
**Symptom**: `npx prisma migrate dev` kräver giltig DATABASE_URL  
**Orsak**: Vi har inte konfigurerat Supabase än  
**Lösning**: 
1. Skapa ett Supabase-projekt
2. Kopiera connection string från Supabase Dashboard
3. Uppdatera DATABASE_URL i .env
**Alternativ lösning**: Använd `npx prisma generate` för att bara generera klienten utan migrering

### Problem: SQL queries ger "relation does not exist"
**Datum**: 2024-12-25  
**Symptom**: `ERROR: relation "musicians" does not exist`  
**Orsak**: Prisma skapar tabeller med UpperCamelCase i PostgreSQL  
**Lösning**: Använd quotes runt tabellnamn i SQL
```sql
-- FEL
SELECT * FROM musicians;

-- RÄTT
SELECT * FROM "Musician";
```
**Förebyggande**: Se DATABASE_TABLE_NAMES.md för alla korrekta tabellnamn

---

## UI/UX-problem

### Problem: Ranking list reorder sparades inte
**Datum**: 2025-06-26  
**Symptom**: När man drog och släppte musiker i rankningslistor återgick ordningen direkt  
**Orsak**: 
1. Fel error-serialisering i API:et som returnerade tom objekt "{}"
2. Unique constraint konflikt på `[listId, rank]` i databasen
**Lösning**: 
1. Implementerade två-stegs uppdatering i transaktionen:
   - Först sätt alla rank till negativa värden
   - Sedan uppdatera till korrekta värden
2. Förbättrade error-serialisering med stack traces
3. Ökade transaction timeout för pooler connection
**Kod**: `/app/api/rankings/[id]/reorder/route.ts`

---

## Prestandaproblem

*Kommer uppdateras när vi stöter på problem*

---

## Request Strategy Problem

### Problem: Parallel och First Come strategier skickade bara till en musiker
**Datum**: 2025-06-26  
**Symptom**: 
- Parallel strategi med 3 behov skickade bara till 1 musiker första gången
- First Come med null maxRecipients skickade bara till 1 musiker istället för alla
- När man simulerade NEJ-svar skickades korrekt antal
**Orsak**: 
1. `createAndSendRequest` fångade alla fel men returnerade inget, så try-catch i loopen trodde alltid att det lyckades
2. Requests skickades sekventiellt med await vilket kunde orsaka timeout
3. Test-systemet använde inte samma `sendRequests` funktion som produktionssystemet
**Lösning**:
1. Ändrade `createAndSendRequest` att returnera boolean (true/false)
2. Implementerade `Promise.allSettled` för att skicka alla requests parallellt
3. Uppdaterade test-systemet att använda samma `sendRequests` funktion
4. Fixade First Come att använda `availableMusicians.length` när maxRecipients är null
**Filer som ändrades**:
- `/lib/request-strategies.ts` - Huvudlogiken för strategier
- `/app/api/test/create-request/route.ts` - Test-systemet

### Problem: First Come strategi uppdaterade inte status när tjänst fylldes
**Datum**: 2025-06-26  
**Symptom**: När någon accepterade i First Come strategin fortsatte andra requests vara "pending"
**Orsak**: Test-systemet saknade logik för att markera andra requests som "cancelled"
**Lösning**: 
1. Lade till logik i `simulate-response` för att kolla om behov är fyllt
2. Om fyllt och strategy är "first_come", uppdatera alla pending till "cancelled"
3. Uppdaterade frontend att visa "Avbruten" status
4. Lade till "cancelled" i statistiken
**Filer som ändrades**:
- `/app/api/test/simulate-response/route.ts`
- `/app/admin/test-requests/page.tsx`
- `/app/api/test/stats/route.ts`

---

## Token-baserat svarssystem

### Problem: Response page visar inte rätt data
**Datum**: 2025-06-26  
**Symptom**: /respond?token=XXX visar fel data eller kraschar  
**Orsak**: API-struktur matchade inte frontend  
**Lösning**: 
1. Uppdaterade response page att använda GET /api/respond?token=XXX
2. Justerade data-strukturen att matcha API-responsen
3. Ändrade från nested projectNeed till platt struktur
**Filer som ändrades**:
- `/app/respond/page.tsx`
- `/app/api/respond/route.ts`

### Problem: Token visas inte i test-requests
**Datum**: 2025-06-26  
**Symptom**: "Öppna svarssida" länk saknas i test-requests  
**Orsak**: Token genereras men inkluderades inte i API-responsen  
**Lösning**: 
1. API inkluderar redan `requestTokens` i response
2. Frontend extraherar token med `request.requestTokens[0]?.token`
3. Token visas som länk i tabellen
**Kod**: Se rad 81 i `/app/admin/test-requests/page.tsx`

### Problem: Tokens har fast 7 dagars giltighetstid
**Datum**: 2025-06-26  
**Symptom**: Tokens går ut efter 7 dagar oavsett svarstid  
**Orsak**: Hårdkodad giltighetstid i `generateRequestToken`  
**Lösning**: 
1. Ändrade `generateRequestToken` att ta `responseTimeHours` som parameter
2. Token går ut exakt när svarstiden löper ut
3. Påminnelser återanvänder befintlig token via `getOrCreateTokenForRequest`
**Förebyggande**: Använd alltid affärslogik för tidsgränser, inte hårdkodade värden

---

## "Skicka förfrågningar" Implementation

### Problem: Saknar UI för att skicka riktiga förfrågningar
**Datum**: 2025-06-26  
**Symptom**: Förfrågningar kan bara skickas via test-systemet  
**Orsak**: MVP saknade produktions-UI för utskick  
**Lösning**: 
1. Lade till "Skicka förfrågningar" knapp i projektvyn
2. Knappen visas bara när behov finns som kräver förfrågningar
3. Bekräftelsedialog visar exakt vad som kommer skickas
4. Skapade `/api/projects/[id]/send-requests` endpoint
5. Smart logik hoppar över pausade och fullbemannade behov
**Filer som ändrades**:
- `/app/admin/projects/[id]/page.tsx` - UI och dialog
- `/app/api/projects/[id]/send-requests/route.ts` - API endpoint

---

## 📝 Mall för nya problem

### Problem: [Kort beskrivning]
**Datum**: YYYY-MM-DD  
**Symptom**: Vad som händer  
**Orsak**: Varför det händer  
**Lösning**: Hur vi löste det  
**Förebyggande**: Hur vi undviker det i framtiden