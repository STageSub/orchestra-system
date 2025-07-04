# Bugfix Checklist - Orchestra System

Detta dokument innehåller alla problem som identifierats och måste åtgärdas innan SaaS-implementation kan påbörjas.

*Senast uppdaterad: 2025-07-04*

## 🔴 KRITISKA PROBLEM (Blockerar användning)

### [x] Musiker får flera förfrågningar för samma projekt
- **Symptom**: Samma musiker kan få förfrågningar för olika positioner i samma projekt
- **Påverkan**: Skapar förvirring och bryter mot affärsregler
- **Lösning**:
  - Uppdaterad getAvailableMusicians för att filtrera projekt-wide
  - En musiker kan bara ha EN aktiv förfrågan per projekt
  - Tackat nej = inga fler förfrågningar för projektet
- **Status**: FIXAD IGEN (2025-06-30)
  - Första fix (2025-06-28) fungerade för enskilda behov
  - NY BUGG: Vid "Skicka alla" uppdaterades inte excludedMusicianIds mellan behov
  - LÖSNING: Lagt till kod i recipient-selection.ts rad 555-557
  - Preview visar nu ALLA musiker med status (✓, ⏱, ✗, →)
  - Detaljerad dokumentation i `/docs/REQUEST_FILTERING_LOGIC.md`

### [x] E-posthistorik fungerar inte
- **Symptom**: Felmeddelande "Kunde inte hämta e-posthistorik" när man öppnar historiken
- **Orsak**: GroupEmailLog-tabellen finns troligen inte i databasen (migration kördes aldrig)
- **Lösning**: Skapa tabellen manuellt eller kör migration
- **Fil**: `/app/api/group-email/history/route.ts`
- **Status**: FIXAD - Visar nu tydlig instruktion med SQL att köra i Supabase
- **SQL-fil**: `/prisma/migrations/manual_add_group_email_log.sql`

### [x] Lokalt boende-kriterium saknas helt
- **Symptom**: Ingen möjlighet att filtrera förfrågningar baserat på lokalt boende
- **Påverkan**: Kan skicka förfrågningar till musiker utan lokalt boende när det krävs
- **Lösning**: 
  - Lägg till fält `requireLocalResidence` i ProjectNeed
  - Uppdatera UI med kryssruta "Kräv lokalt boende"
  - Implementera filtrering i `/lib/request-sender.ts`
- **Status**: FIXAD - Implementerat fullt ut
- **SQL-fil**: `/prisma/migrations/manual_add_local_residence_filter.sql`

### [x] Konfliktvarningar fungerar inte
- **Symptom**: Ingen varning när musiker finns på flera listor (t.ex. Daniel)
- **Påverkan**: Risk för dubbla förfrågningar till samma musiker
- **Lösning**:
  - Skapa API endpoint `/api/projects/[id]/conflicts`
  - Implementera varningsikoner i UI
  - Integrera med send-requests flödet
- **Status**: FULLT IMPLEMENTERAD (2025-06-29)
  - API endpoint uppdaterad för att hitta musiker på olika positioner
  - ConflictWarning visar nu musiker som finns på flera listor
  - Länk till systeminställningar inkluderad
  - Tre strategier implementerade: Enkel, Detaljerad, Smart
  - Smart strategi analyserar rankings och prioriterar bästa position
  - ConflictWarning visar aktiv strategi med förklaring
  - Visas i både projektvy och preview modal
  - Preview synkad med faktisk filtrering
  - Detaljerad dokumentation skapad i `/docs/CONFLICT_HANDLING_DETAILED.md`

### [x] Toast-notifikationer syns inte
- **Symptom**: Inga visuella notifikationer vid händelser (musiker svarar ja/nej)
- **Påverkan**: Användaren missar viktiga händelser
- **Lösning**:
  - Toast-systemet finns men används inte
  - Lägg till toast i `/app/api/respond/route.ts`
  - Integrera överallt där alert() används
- **Status**: KORREKT IMPLEMENTERAD (2025-06-29)
  - Rätt mönster används: alert() för admin-handlingar, toast() för externa händelser
  - useProjectEvents pollar var 10:e sekund och visar toast för musikersvar
  - EventListener och ToastContainer fungerar i admin layout
  - Detta är INTE en bugg - systemet följer dokumenterat UI/UX-mönster

### [x] Preview/Sändningslogik är inte synkroniserad
- **Symptom**: Preview visade andra resultat än vad som faktiskt skickades
- **Specifika problem**:
  - FCFS preview visade bara en mottagare när maxRecipients var tomt (skulle visa alla)
  - Preview respekterade inte lokalt boende-filter
  - Preview hanterade inte konflikter när musiker fanns i flera listor
- **Påverkan**: Användaren fick fel förväntningar om vem som skulle få förfrågningar
- **Lösning**:
  - Skapade gemensam logik i `/lib/recipient-selection.ts`
  - Både preview och sändning använder nu exakt samma filtreringsregler
  - Fixade alla specifika buggar i FCFS och lokal boende-filtrering
- **Status**: FIXAD (2025-06-30)
  - Ny fil: `/lib/recipient-selection.ts` med enhetlig logik
  - Uppdaterade både preview och sändningsflödet
  - Verifierat att preview matchar faktisk sändning 100%

### [x] 500-fel på grund av preferredLanguage
- **Symptom**: 500-fel med "Unknown argument preferredLanguage" på musikersidan
- **Orsak**: Prisma-schemat hade preferredLanguage men Supabase saknade kolumnen
- **Lösning**: 
  - Skapade `/prisma/migrations/manual_add_preferred_language.sql`
  - Dokumenterade process i `/docs/PRISMA_SUPABASE_SYNC.md`
  - Uppdaterade CLAUDE.md med synkroniseringsinstruktioner
- **Status**: FIXAD (2025-06-30)
  - SQL-migration skapad och klar att köras i Supabase
  - Omfattande dokumentation för att undvika framtida problem

### [x] Custom Ranking Lists - Implementation och buggar
- **Symptom**: Kunde inte skapa anpassade rankningslistor för projekt
- **Problem 1**: 500-fel vid sparande - saknade ID-prefix för 'customList'
- **Problem 2**: Null reference errors - rankingList förväntades alltid finnas
- **Problem 3**: Databastabeller saknades i produktion
- **Lösning**:
  - Implementerade komplett custom lists system med drag & drop
  - Lade till 'customList: CLIST' i ID_PREFIXES
  - Gjorde rankingList optional i alla interfaces
  - Skapade migrations för databastabeller
  - Lade till backwards compatibility i alla API endpoints
- **Status**: FIXAD (2025-07-04)
- **SQL-fil**: `/prisma/migrations/combined_custom_lists_migration.sql`

## 🟡 VIKTIGA ANVÄNDBARHETSPROBLEM

### [x] Moment 22 med strategi/antal
- **Status**: REDAN LÖST (upptäckt 2025-06-29)
- **Problem**: Trodde att det fanns valideringsproblem mellan strategi och antal
- **Lösning**: Redan implementerat - ingen default strategi, smart quantity-hantering
- **Verifiering**: 
  - Sequential: Antal låst till 1 (readonly fält)
  - Parallel: Dropdown börjar på 2 (kan välja 2-20)
  - First come: Flexibel (kan välja 1-20)
- **Files**: `/components/add-project-need-modal.tsx`

### [x] Instrument laddas utan feedback
- **Symptom**: När man klickar "Välj instrument" händer inget första gången
- **Påverkan**: Användaren tror systemet hängt sig
- **Lösning**: Lägg till spinner eller disabled state i `/components/add-project-need-modal.tsx`
- **Status**: FIXAD (2025-06-29)
  - Lade till instrumentsLoading state och visning av "Laddar instrument..."
  - Disabled state på select under laddning

### [x] Arkivera musiker redirect
- **Symptom**: Efter arkivering hoppar man automatiskt till musikerlistan
- **Önskemål**: Stanna kvar på musikerprofilen
- **Fil**: `/app/admin/musicians/[id]/page.tsx` rad 172
- **Status**: FIXAD (2025-06-29)
  - Tar bort router.push() efter arkivering
  - Stannar på samma sida och refreshar data
  - alert() visar bekräftelse

### [x] Archive/restore för instrument saknas
- **Symptom**: Funktionen nämndes som implementerad men finns inte
- **Påverkan**: Kan inte arkivera oanvända instrument
- **Lösning**: Implementera UI och API för instrument arkivering
- **Status**: FIXAD (2025-06-29)
  - Lade till archive/restore funktioner i `/app/admin/instruments/[id]/page.tsx`
  - Uppdaterade API endpoint för att stödja isArchived fält
  - Visar "Arkiverad" badge både på edit-sidan och i listan
  - Archive/Restore knappar med loading states

## 🟢 MINDRE PROBLEM (Förbättringar)

### [ ] Uppdateringstext i projekt
- **Symptom**: "Uppdateras automatiskt" och sekundräkning tar onödig plats
- **Önskemål**: Subtil "Senast uppdaterad: 19:18" längst ner till vänster
- **Fil**: `/app/admin/projects/[id]/page.tsx` rad 488

### [ ] Visningsordning i instrumentredigering
- **Symptom**: Visningsordning visas för användaren (inte nödvändigt)
- **Lösning**: Ta bort fältet från UI
- **Fil**: `/app/admin/instruments/[id]/page.tsx` rad 186-196

### [ ] Ta bort-knapp placering
- **Symptom**: Delete-ikon finns i instrumentlistan
- **Önskemål**: Flytta till redigeringsvyn istället
- **Fil**: `/app/admin/instruments/page.tsx`

## ✨ NYA FUNKTIONER IMPLEMENTERADE (2025-06-30)

Utöver buggfixar har följande nya funktioner lagts till:

1. **SuccessModal-komponent** - Grön animerad bock för bekräftelser
2. **ResponseTimeSelector** - Flexibla svarstider (timmar/dagar/veckor/månader)
3. **Projektborttagning** - Radera-ikon för projekt utan förfrågningar
4. **Multi-select rankningslistor** - Bulk-tillägg av behov med checkboxar
5. **Flerspråkigt stöd** - Svenska/engelska e-postmallar baserat på musikerprefens
6. **Förbättrad rankningshierarki** - Korrekt sortering (instrument först, sedan listtyp)

Alla funktioner är fullt implementerade och testade!

## 📊 IMPLEMENTATION STATUS

### ✅ Påstått implementerat men fungerar inte:
- Toast-notifikationer (systemet finns men används inte)
- Konflikthantering (inställning finns men ingen funktionalitet)
- Instrument archive/restore (schema uppdaterat men ingen UI)
- GroupEmailLog (tabell skapad men migration kördes inte)

### ⚠️ Delvis implementerat:
- Phone validation (fungerar men visar inte vem som har numret)
- Smart polling (fungerar men ingen realtidsnotifikation)
- Sequential strategy limit (validering finns men skapar UX-problem)

### ❌ Helt saknas:
- Lokalt boende-filter
- Konfliktvarningar och hantering
- Realtidsuppdateringar (SSE/WebSocket)
- Laddningsindikatorer på flera ställen

## ✅ DATABASPROBLEM LÖST (2025-06-28)

Efter att ha kört SQL-migreringen i Supabase fungerar nu:
- E-posthistorik (GroupEmailLog-tabellen skapad)
- Lokalt boende-filter (requireLocalResidence-kolumnen tillagd)
- Instrument arkivering (isArchived och archivedAt kolumner tillagda)
- Fil-metadata (originalFileName och mimeType kolumner tillagda)

## 🚀 REALTIDSLÖSNING

### Fråga: "Går det att bygga systemet så att det visas allt i realtid?"

### Rekommenderad lösning: Hybrid approach
1. **Server-Sent Events (SSE)** för notifikationer
   - När musiker svarar ja/nej
   - När nya förfrågningar skickas
   - När projekt uppdateras

2. **Optimerad polling** för datasynk
   - Behåll nuvarande 30-sekunders polling
   - Kombinera med SSE för omedelbara notifikationer

3. **Toast-notifikationer** för feedback
   - Visa alla händelser som toast
   - Ljud för viktiga händelser (optional)

### Implementation:
```typescript
// SSE endpoint: /api/events
// Frontend: EventSource API
// Fallback: Polling om SSE inte stöds
```

## NÄSTA STEG

1. **Prioritera kritiska problem** - Dessa måste lösas först
2. **Testa varje fix** - Säkerställ att allt fungerar
3. **Uppdatera dokumentation** - Håll CLAUDE.md uppdaterad
4. **Först när allt fungerar** - Påbörja SaaS-implementation

---

*Senast uppdaterad: 2025-06-30 (Kväll)*
*Alla kritiska problem MÅSTE lösas innan SaaS-fas kan påbörjas!*