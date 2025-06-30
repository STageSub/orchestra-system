# Komplett Projektdokumentation - Orkestervikarieförfrågningssystem

**Senast uppdaterad: 2025-06-28**

## 📋 Projektbeskrivning

Ett orkestervikarieförfrågningssystem för admin-personal i orkestrar. Systemet hanterar en musikerdatabas där varje musiker har kvalifikationer kopplade till specifika tjänster inom olika instrument. Admin kan skapa rankningslistor för varje tjänst/kvalifikation och sedan automatisera förfrågningsprocessen för vikariat baserat på dessa rankningar.

## ⚠️ VIKTIGT: Aktuell Status

Systemet är ~65% färdigt och har flera kritiska buggar som måste åtgärdas innan produktionslansering:

### Kritiska problem:
- **E-posthistorik fungerar inte** - Databastabellen saknas
- **Lokalt boende-filter saknas helt** - Ingen möjlighet att filtrera baserat på boende
- **Konfliktvarningar fungerar inte** - Ingen varning när musiker finns på flera listor
- **Toast-notifikationer syns inte** - Systemet finns men används inte

Se `/BUGFIX_CHECKLIST.md` för fullständig lista och `/IMPLEMENTATION_STATUS.md` för detaljerad status.

## 🎯 Kärnfunktionalitet

### 1. Musikerdatabas
- **Unik Musiker-ID**: MUS001, MUS002, etc. (alla musiker har samma prefix)
- **Information per musiker**:
  - Förnamn, Efternamn
  - Mobilnummer, E-postadress
  - Lokalt boende (Ja/Nej)
  - Instrument (väljs från dropdown)
  - Kvalifikationer (checkboxar baserat på valt instrument)
  - Status: Aktiv/Inaktiv/Arkiverad

### 2. Instrument & Tjänster/Kvalifikationer

#### Violin
- Förste konsertmästare
- Andre konsertmästare
- Stämledare violin 2
- Tutti violin 1
- Tutti violin 2

#### Viola
- Stämledare
- Alternerande stämledare
- Tutti

#### Cello
- Solocellist
- Alternerande stämledare
- Tutti

#### Kontrabas
- Stämledare
- Tutti

### 3. Rankningssystem
- Varje kvalifikation/tjänst kan ha flera rankningslistor
- Exempel: Förste konsertmästare kan ha:
  - A-lista
  - B-lista
  - C-lista
- Varje lista kan ha en valfri beskrivning (t.ex. "För erfarna musiker", "Reservlista")
- Admin kan enkelt ändra rankningar via drag & drop
- En musiker kan finnas i flera listor (A, B och C) för samma position med olika ranking
- Inaktiva musiker:
  - Behåller sin position i alla listor
  - Visas tydligt markerade som inaktiva
  - Kan läggas till i listor även som inaktiva
  - Hoppas över automatiskt vid förfrågningar när de är inaktiva

### 4. Projekthantering
- **Projektinformation**:
  - Projektnamn (t.ex. "Mahler 5")
  - Startdatum
  - Vecka
  - Repetitionsperiod (textformat, t.ex. "Mån-Tors 10:00-14:00")
  - Konsertdagar (textformat, t.ex. "Fredag kl 19:00")
  - Anteckningar (valfritt textfält för ytterligare projektinformation)
  - Filuppladdning (PDF om projektet)
  - Noter per instrument (skickas automatiskt vid JA-svar)
- **Projektsortering**:
  - Kommande projekt visas först (kronologisk ordning)
  - Avslutade projekt visas sist (omvänd kronologisk ordning)

### 5. Förfrågningsstrategier

#### Sekventiell
- Skickar till en musiker i taget enligt rankning
- Vid NEJ/timeout → nästa i listan

#### Parallell
- Skickar till flera samtidigt baserat på behov
- Om någon svarar NEJ → skicka till nästa

#### Först till kvarn
- Skickar till max antal mottagare samtidigt
- Första X som svarar JA får jobbet
- När behov fyllt → "position fylld" mail till resterande

## 📊 Detaljerade Användningsscenarier

### Scenario 1: Admin skapar ny musiker
1. Admin klickar "Ny musiker"
2. Fyller i: Daniel Migdal, daniel@example.com, 070-123456
3. Väljer instrument: Violin (dropdown)
4. Kryssar i kvalifikationer:
   - ✓ Förste konsertmästare
   - ✓ Andre konsertmästare
5. Sparar → MUS003 skapas automatiskt

### Scenario 2: Admin skapar rankningslista
1. Admin går till "Förste konsertmästare"
2. Klickar "+ Skapa lista" under A-lista
3. Kan lägga till beskrivning: "För mycket erfarna musiker"
4. Drar och släpper musiker i ordning:
   1. Anna Svensson
   2. Erik Johansson
   3. Daniel Migdal
5. Listan sparas automatiskt
6. Samma musiker kan också finnas i B-listan med annan ranking

### Scenario 3: Sekventiell förfrågan
1. Admin skapar projekt "Mahler 5"
2. Behov: 1 Förste konsertmästare (A-lista)
3. System skickar till Anna (position 1)
4. Anna svarar NEJ efter 12h
5. System skickar automatiskt till Erik (position 2)
6. Erik svarar JA
7. Tackmail skickas med noter, förfrågan stoppas

### Scenario 4: Parallell förfrågan
1. Projekt behöver 2 Tutti violin 1
2. "Parallellt" = JA
3. System skickar samtidigt till:
   - Musiker A (rank 1)
   - Musiker B (rank 2)
4. A svarar JA, B svarar NEJ
5. System skickar automatiskt till C (rank 3)
6. C svarar JA
7. Behov fyllt, tackmails skickas med noter

### Scenario 5: Först till kvarn
1. Projekt behöver 3 altfioler
2. "Först till kvarn" = JA, max 6 mottagare
3. Förfrågan skickas till 6 musiker samtidigt
4. Svar kommer:
   - 10:15: Musiker B svarar JA
   - 10:22: Musiker D svarar JA
   - 10:45: Musiker A svarar JA
   - 11:00: Musiker C svarar JA (får "platsen fylld")
5. B, D och A får jobbet (först att svara)
6. System skickar "position fylld" mail till alla som inte svarat

### Scenario 6: Musikerprofil
Admin klickar på "Daniel Migdal" (från rankningslistan eller musikerfliken):
- Kontaktinfo visas
- Kvalifikationer: Förste & Andre konsertmästare
- Rankningspositioner:
  - Förste KM A-lista: Position 3
  - Förste KM B-lista: Position 1
  - Förste KM C-lista: Position 5
  - Andre KM A-lista: Position 2
- Historik: 15 förfrågningar, 12 JA, 3 NEJ
- Svarstid: Genomsnitt 4.5 timmar
- Status: Aktiv/Inaktiv visas tydligt

### Scenario 7: Inaktiv musiker
1. Maria är rank 2 på Cello A-lista
2. Admin markerar Maria som "Inaktiv" (t.ex. pga semester)
3. Maria visas fortfarande i A-listan med "Inaktiv" badge
4. Maria kan fortfarande läggas till i B och C-listor
5. Projekt behöver cellist från A-lista
6. System hoppar över Maria automatiskt, går direkt till rank 3
7. Maria behåller sin rank 2 position tills hon blir aktiv igen

### Scenario 8: E-postsvar
1. Musiker får e-post med två knappar
2. Klickar "JA"
3. Webbläsare öppnas: app.com/respond?token=abc123&answer=yes
4. System validerar token
5. Visar: "Tack! Du är nu bokad för Mahler 5"
6. Bekräftelse-mail skickas automatiskt med relevanta noter

### Scenario 9: Timeout och påminnelse
1. Förfrågan skickas kl 09:00 (24h svarstid)
2. Kl 21:00 (12h) - påminnelse skickas
3. Kl 09:00 nästa dag - timeout
4. System registrerar "ingen respons"
5. Går automatiskt vidare till nästa i listan

### Scenario 10: Komplex bemanning
Projekt "Brahms Requiem" behöver:
- 2 Förste konsertmästare (A-lista) - Parallellt
- 4 Tutti violin 1 (B-lista) - Först till kvarn, max 8
- 3 Tutti violin 2 (C-lista) - Sekventiellt
- 1 Stämledare viola (A-lista) - Sekventiellt

System hanterar alla förfrågningar samtidigt med olika strategier per behov.

## 📧 E-postmallar

### Implementerat mallsystem
Systemet har nu ett flexibelt mallsystem med följande funktioner:
- **CRUD-operationer** för mallar via admin-gränssnittet
- **Variabelstöd** med dubbla klammerparenteser: {{variabelnamn}}
- **Visuell variabelinsättning** i malleditorn
- **Seed-funktion** för att lägga in standardmallar
- **Kompakt tabellvy** utan horisontell scrollning

### Tillgängliga variabler per malltyp:

#### Request (Förfrågan)
- {{musicianName}}, {{projectName}}, {{position}}, {{projectDate}}
- {{projectInfo}}, {{rehearsalSchedule}}, {{concertInfo}}
- {{responseLink}}, {{responseTime}}

#### Reminder (Påminnelse)
- {{musicianName}}, {{projectName}}, {{position}}, {{responseLink}}

#### Confirmation (Bekräftelse)
- {{musicianName}}, {{projectName}}, {{position}}
- {{projectDate}}, {{firstRehearsal}}

#### Position Filled (Position fylld)
- {{musicianName}}, {{projectName}}, {{position}}

### Standardmallar (kan redigeras):

### 1. Förfrågningsmail
```
Ämne: Förfrågan om vikariat - {{projectName}} - {{position}}

Hej {{musicianName}},

Vi söker en vikarie för positionen {{position}} till vårt projekt "{{projectName}}" som äger rum {{projectDate}}.

**Projektdetaljer:**
{{projectInfo}}

**Repetitionsschema:**
{{rehearsalSchedule}}

**Konsertinformation:**
{{concertInfo}}

Vänligen svara genom att klicka på länken nedan:
{{responseLink}}

Svar önskas senast inom 24 timmar.

Med vänliga hälsningar,
Orkesteradministrationen
```

### 2. Påminnelsemail
```
Ämne: Påminnelse: Svar önskas - {{projectName}}

Hej {{musicianName}},

Detta är en påminnelse om vår tidigare förfrågan angående vikariat för {{position}} i projektet "{{projectName}}".

Vi har ännu inte mottagit ditt svar och skulle uppskatta om du kunde meddela oss snarast möjligt.

Klicka här för att svara: {{responseLink}}

Om du inte är intresserad, vänligen meddela oss det också så vi kan gå vidare med andra kandidater.

Med vänliga hälsningar,
Orkesteradministrationen
```

### 3. Bekräftelsemail
```
Ämne: Bekräftelse - {{projectName}}

Hej {{musicianName}},

Tack för att du tackat ja till att vikariera som {{position}} i projektet "{{projectName}}"!

Vi ser fram emot att ha dig med oss.

**Viktiga datum:**
{{projectDate}}

**Första repetition:**
{{firstRehearsal}}

Noter och ytterligare information kommer att skickas separat.

Om du har några frågor, tveka inte att kontakta oss.

Med vänliga hälsningar,
Orkesteradministrationen
```

### 4. Position fylld
```
Ämne: Position fylld - {{projectName}}

Hej {{musicianName}},

Tack för ditt intresse för att vikariera som {{position}} i projektet "{{projectName}}".

Vi vill informera dig om att positionen nu är fylld.

Vi hoppas få möjlighet att arbeta med dig i framtida projekt.

Med vänliga hälsningar,
Orkesteradministrationen
```

## 🗄️ Databastabeller (15 st)

### Översikt med ID-prefix

| Tabell | ID-Prefix | Exempel |
|--------|-----------|---------|
| musicians | MUS | MUS001, MUS002... |
| instruments | INST | INST001, INST002... |
| positions | POS | POS001, POS002... |
| musician_qualifications | - | Relationstabell |
| ranking_lists | RANK | RANK001, RANK002... |
| rankings | RNK | RNK001, RNK002... |
| projects | PROJ | PROJ001, PROJ002... |
| project_needs | NEED | NEED001, NEED002... |
| requests | REQ | REQ001, REQ002... |
| request_tokens | Token | CUID-format |
| email_templates | TEMP | TEMP001, TEMP002... |
| communication_log | COMM | COMM001, COMM002... |
| project_files | FILE | FILE001, FILE002... |
| audit_log | AUDIT | AUDIT001, AUDIT002... |
| id_sequences | - | Systemtabell |

### Detaljerade tabellbeskrivningar (med faktiska tabellnamn)

#### 1. "Musician" (MUS-prefix)
- id, musicianId, firstName, lastName, email, phone, localResidence
- isActive, isArchived, archivedAt, restoredAt
- createdAt, updatedAt

#### 2. "Instrument" (INST-prefix)
- id, instrumentId, name, displayOrder

#### 3. "Position" (POS-prefix)
- id, positionId, instrumentId, name, hierarchyLevel

#### 4. "MusicianQualification"
- musicianId, positionId (relationstabell)

#### 5. "RankingList" (RANK-prefix)
- id, rankingListId, positionId, listType (A/B/C), description (valfri), version

#### 6. "Ranking" (RNK-prefix)
- id, rankingId, listId, musicianId, rank

#### 7. "Project" (PROJ-prefix)
- id, projectId, name, startDate, weekNumber
- rehearsalSchedule, concertInfo, notes
- createdAt, updatedAt

#### 8. "ProjectNeed" (NEED-prefix)
- id, projectNeedId, projectId, positionId, quantity
- rankingListId, requestStrategy, maxRecipients

#### 9. "Request" (REQ-prefix)
- id, requestId, projectNeedId, musicianId
- status, sentAt, reminderSentAt, respondedAt
- response, confirmationSent

#### 10. "RequestToken"
- token (CUID), requestId, createdAt, expiresAt, usedAt

#### 11. "EmailTemplate" (TEMP-prefix)
- id, emailTemplateId, type, subject, body, variables
- type: request, reminder, confirmation, position_filled
- createdAt, updatedAt

#### 12. "CommunicationLog" (COMM-prefix)
- id, communicationLogId, requestId, type, timestamp, emailContent

#### 13. "ProjectFile" (FILE-prefix)
- id, projectFileId, projectId, fileName, fileUrl, fileType
- positionId (NULL för allmän info)

#### 14. "AuditLog" (AUDIT-prefix)
- id, auditLogId, userId, action, entityType, entityId
- oldValues, newValues, timestamp

#### 15. "IdSequence"
- id, entityType, lastNumber, updatedAt
- Säkerställer att ID:n aldrig återanvänds

**OBS**: I SQL måste du använda quotes: `SELECT * FROM "Musician"`

## 🔧 Tekniska säkerhetsåtgärder

### ID-hantering (KRITISKT)
- **Aldrig återanvänd ID:n** - Även borttagna musiker/projekt behåller sina ID
- Separat ID-sekvens tabell säkerställer unika ID:n
- Databastransaktion vid ID-generering
```typescript
// Säker ID-generering
const newId = await generateUniqueId('musician') // MUS001, MUS002...
// ID:n återanvänds ALDRIG, även om MUS001 tas bort
```

### Race Conditions
```typescript
// Databastransaktion för "först till kvarn"
await prisma.$transaction(async (tx) => {
  // Kontrollera om behov redan fyllt
  // Registrera svar endast om plats finns
});
```

### E-postbegränsningar
- Rate limiting: Max 50 mail/minut
- SPF/DKIM/DMARC konfiguration
- Dedicerad IP för e-post

### Samtidiga ändringar
- Optimistic locking för rankningslistor
- Versionshantering för att undvika konflikter
- Musikernamn i rankningslistor är klickbara länkar till musikerprofilen
- Ta bort musiker från lista med X-knapp (med bekräftelse)

### Input-validering
- Zod schemas för all användarinput
- Sanitering av e-postadresser och telefonnummer

## 📈 Statistik & Rapporter

### Per musiker
- Antal förfrågningar
- Svarsfrekvens (JA/NEJ/Timeout)
- Genomsnittlig svarstid
- Senaste aktivitet

### Per projekt
- Fyllnadsgrad
- Tid att fylla alla positioner
- Antal förfrågningar totalt
- Kostnadsöversikt

## 📊 Senaste uppdateringar (2025-06-26)

### Dashboard med realtidsstatistik
- Dynamisk hämtning av data från databasen
- Visar totalt antal musiker och hur många som är aktiva
- Antal aktiva projekt (med framtida startdatum)
- Väntande svar och påminnelser
- Svarsfrekvens för senaste 30 dagarna
- API endpoint: `/api/dashboard/stats`

### Projekt-detaljvy förbättringar
- **Två-kolumns layout**:
  - Vänster: Projektinformation (grundinfo, repetitionsschema, konsertinfo, noter, filer)
  - Höger: Kombinerad vy för musikerbehov och förfrågningar
- **Pausa/återuppta funktionalitet** för enskilda behov
- **Grid-baserad knapp-alignment** för konsekvent UI
- **Visa alla projektdetaljer** inklusive repetitionsschema och konsertinformation

### Musikerprofil utökad
Tre nya sektioner har lagts till:

#### 1. Rankningar
- Visar musikerns position i alla rankningslistor
- Grupperat efter instrument och position
- Klickbara länkar till respektive rankningslista
- Stor, tydlig siffra för rankningsposition

#### 2. Projekthistorik
- Lista över alla projekt där musikern fått förfrågningar
- Visar projektnamn, datum och status (kommande/genomfört)
- Status för varje förfrågan (accepterad/avböjd/väntar svar)
- Datum när musikern svarade
- API endpoint: `/api/musicians/[id]/project-history`

#### 3. Statistik
- Totalt antal förfrågningar (accepterade/avböjda/väntande)
- Acceptansgrad med visuell progress bar
- Genomsnittlig svarstid i timmar/dagar
- Top 3 mest efterfrågade positioner
- Förfrågningar per år
- API endpoint: `/api/musicians/[id]/statistics`

### Tekniska förbättringar
- **Grid Layout**: Använder CSS Grid för konsekvent knapp-alignment
- **API Optimization**: Promise.all() för parallella databas-queries
- **Error Handling**: Förbättrad felhantering med användarvänliga meddelanden
- **Performance**: Server-side beräkningar för statistik

## 🚀 Framtida utvecklingsmöjligheter

### Nästa fas - Token-baserat svarssystem
- Musiker svarar via unik länk (ingen inloggning)
- Automatisk e-postutskick med mallsystemet
- Spårning av svar och automatisering baserat på strategi
- Påminnelser baserat på responseTimeHours

### Övriga möjligheter
1. **SMS-integration** - Backup för viktiga förfrågningar
2. **Kalendersynk** - Integration med Google/Outlook
3. **Mobilapp** - Native app för snabbare svar
4. **Avancerad analys** - Prediktiv analys av svarsfrekvens
5. **Multi-tenant** - Stöd för flera orkestrar i samma system