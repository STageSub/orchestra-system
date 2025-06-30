# Stress Test Documentation - Orchestra System Request Flow

## 🎯 Syfte
Detta dokument beskriver det omfattande stresstestsystemet för Orchestra Systems förfrågningsflöde. Systemet testar ALLA aspekter av förfrågningshanteringen inklusive e-post, timeouts, konflikthantering och statistik.

## 🏗️ Arkitektur

### Filstruktur
```
/scripts/
├── stress-test-requests.ts      # Huvudfil som orkestrerar alla tester
├── test-scenarios.ts            # Alla testscenarier definierade
├── test-helpers.ts              # Hjälpfunktioner för tester
├── test-email-mock.ts           # Mock för e-postsystemet
└── test-report-generator.ts     # Genererar detaljerade rapporter
```

### Huvudkomponenter

#### 1. stress-test-requests.ts
**Syfte**: Orkestrerar hela testsviten
**Funktioner**:
- `runAllTests()`: Kör alla testscenarier
- `setupTestEnvironment()`: Förbereder testmiljön
- `cleanupTestData()`: Rensar testdata efter körning
- `generateReport()`: Skapar slutrapport

#### 2. test-scenarios.ts
**Syfte**: Definierar alla testscenarier
**Kategorier**:
- Strategy tests (sequential, parallel, first_come)
- Conflict scenarios
- Email flow tests
- Timeout handling
- Statistics verification

#### 3. test-helpers.ts
**Syfte**: Återanvändbara hjälpfunktioner
**Funktioner**:
- `createTestMusician()`: Skapar testmusiker
- `createTestProject()`: Skapar testprojekt
- `simulateTimePassage()`: Simulerar tidsförlopp
- `verifyEmailSent()`: Verifierar e-postutskick
- `checkStatistics()`: Kontrollerar statistik

#### 4. test-email-mock.ts
**Syfte**: Mockar e-postsystemet för testning
**Funktioner**:
- `interceptEmail()`: Fångar utgående e-post
- `getEmailsSent()`: Returnerar skickade e-post
- `verifyEmailContent()`: Validerar e-postinnehåll
- `clearEmailQueue()`: Rensar e-postkön

## 📋 Testscenarier

### 1. Strategitester

#### Sequential Strategy
```typescript
describe('Sequential Strategy Tests', () => {
  test('Should send to one musician at a time', async () => {
    // Setup: 3 positions, 10 musicians
    // Verify: Only 1 pending request at any time
    // Test accept/decline flow
  })
  
  test('Should handle declined requests correctly', async () => {
    // Musician 1 declines → Musician 2 gets request
    // Verify no overlap
  })
  
  test('Should complete when all positions filled', async () => {
    // Fill all 3 positions
    // Verify no more requests sent
  })
})
```

#### Parallel Strategy
```typescript
describe('Parallel Strategy Tests', () => {
  test('Should maintain correct number of active requests', async () => {
    // Need 5 positions
    // Should always have 5 pending (or less if accepted)
  })
  
  test('Should refill on decline', async () => {
    // 5 active, 1 declines
    // Should immediately send to #6
  })
  
  test('Should stop when all accepted', async () => {
    // All 5 accept
    // No more requests
  })
})
```

#### First Come Strategy
```typescript
describe('First Come Strategy Tests', () => {
  test('Should respect maxRecipients', async () => {
    // maxRecipients = 10, need 5
    // Send exactly 10 requests
  })
  
  test('Should send to all when maxRecipients is null', async () => {
    // maxRecipients = null
    // Send to ALL available musicians
  })
  
  test('Should cancel pending when filled', async () => {
    // 5 needed, 10 sent, 5 accept
    // Remaining 5 get cancelled + email
  })
})
```

### 2. Konflikthantering

```typescript
describe('Conflict Handling Tests', () => {
  test('Musician on multiple lists gets only one request', async () => {
    // Daniel on violin A-list and viola B-list
    // Should receive only 1 request for the project
  })
  
  test('Declined musician excluded from entire project', async () => {
    // Daniel declines violin
    // Should NOT get viola request
  })
  
  test('Conflict warning shows correctly', async () => {
    // Multiple musicians on multiple lists
    // Warning component should display all conflicts
  })
})
```

### 3. E-postflöden

```typescript
describe('Email Flow Tests', () => {
  test('Initial request email', async () => {
    // Verify correct template
    // Check token generation
    // Validate variables substitution
  })
  
  test('Reminder at 75% of response time', async () => {
    // 48h response time
    // Reminder at 36h
    // Same token used
  })
  
  test('Confirmation email on accept', async () => {
    // Musician accepts
    // Confirmation sent
    // Correct template and content
  })
  
  test('Position filled notification', async () => {
    // First come strategy
    // Position fills
    // All pending get notification
  })
})
```

### 4. Timeouthantering

```typescript
describe('Timeout Handling Tests', () => {
  test('Status changes to timed_out not declined', async () => {
    // Wait past response time
    // Status = 'timed_out'
    // Statistics differentiate timeout vs declined
  })
  
  test('Next musician contacted after timeout', async () => {
    // Musician 1 times out
    // Musician 2 automatically gets request
  })
  
  test('No duplicate timeouts', async () => {
    // Ensure timeout only processes once
  })
})
```

### 5. Statistikverifiering

```typescript
describe('Statistics Tests', () => {
  test('Project statistics accuracy', async () => {
    // Total requests
    // Accepted/Declined/Timed_out/Pending counts
    // Response rate calculation
  })
  
  test('Musician statistics tracking', async () => {
    // Individual response rates
    // Average response time
    // Historical data
  })
  
  test('Strategy effectiveness metrics', async () => {
    // Time to fill positions per strategy
    // Success rates
    // Efficiency comparisons
  })
})
```

## 🔄 Kompletta flödestester

### Test 1: Sequential - Komplett flöde
```
1. Setup
   - Skapa projekt "Beethoven Symfoni 5"
   - 3 violin positions (sequential strategy)
   - 10 kvalificerade musiker på A-listan
   - 48 timmars svarstid

2. Körning
   - Start: Skicka till Musiker #1
   - Verifiera: E-post skickad med korrekt innehåll
   - T+36h: Påminnelse skickas (75% av svarstid)
   - T+40h: Musiker #1 tackar nej
   - Verifiera: Musiker #2 får förfrågan omedelbart
   - T+48h: Musiker #2 timeout
   - Verifiera: Status = 'timed_out', Musiker #3 kontaktas
   - Musiker #3 accepterar
   - Verifiera: Bekräftelsemail skickat
   - Fortsätt tills alla 3 positioner fyllda

3. Verifiering
   - Total tid: ~5 dagar
   - E-post skickade: 8 (5 initial, 2 reminders, 1 confirmation)
   - Slutstatistik korrekt
```

### Test 2: Parallel med konflikter
```
1. Setup
   - Projekt med 3 violin + 2 viola positions
   - Daniel på både violin och viola listor
   - Maria på violin A och B lista
   - Parallel strategy för båda

2. Körning
   - Skicka förfrågningar för violin (3 st)
   - Daniel får förfrågan för violin
   - Skicka förfrågningar för viola (2 st)
   - Daniel får INTE förfrågan (redan tillfrågad)
   - Maria får endast 1 förfrågan (trots 2 listor)

3. Verifiering
   - Inga dubbla förfrågningar
   - Konfliktvarning visas i UI
   - Statistik reflekterar korrekt antal
```

### Test 3: First Come stresstest
```
1. Setup
   - 5 positions behövs
   - maxRecipients = 10
   - 50 musiker tillgängliga
   - 24h svarstid

2. Körning
   - T+0: 10 förfrågningar skickas samtidigt
   - T+2h: Musiker #3, #7, #1 accepterar (i den ordningen)
   - T+4h: Musiker #9, #4 accepterar
   - Position fylld! (5/5)
   - Musiker #2,5,6,8,10 får "position filled" email
   - Status ändras till 'cancelled'

3. Verifiering
   - Exakt 10 initial emails
   - 5 confirmation emails
   - 5 position filled emails
   - Ingen fick timeout
```

## 📊 Rapportformat

### Sammanfattning
```
=== ORCHESTRA SYSTEM STRESS TEST RAPPORT ===
Datum: 2025-06-28 14:32:15
Version: 1.0.0
Total körtid: 127.4 sekunder

ÖVERSIKT:
Total tester: 89
Godkända: 87 (97.8%)
Misslyckade: 2 (2.2%)
Överhoppade: 0

KATEGORIRESULTAT:
✅ Strategy Tests: 24/24 (100%)
✅ Conflict Handling: 15/15 (100%)
❌ Email Flow: 18/20 (90%)
✅ Timeout Handling: 12/12 (100%)
✅ Statistics: 20/20 (100%)
```

### Detaljerad felrapport
```
❌ MISSLYCKADE TESTER:

Test: "Reminder email should use same token"
Fil: test-scenarios.ts:245
Förväntat: Token "abc123" i påminnelsemail
Faktiskt: Ny token "xyz789" genererad
Stack trace:
  at verifyEmailContent (test-helpers.ts:123)
  at reminderEmailTest (test-scenarios.ts:248)
  
Möjlig orsak: getOrCreateTokenForRequest skapar ny token
Förslag: Kontrollera token-cache implementation
```

### Performance metrics
```
PERFORMANCE ANALYS:
- Genomsnittlig request-tid: 34ms (OK)
- Långsammaste operation: getAvailableMusicians (245ms)
- Database queries: 4,521
- Peak memory: 287MB
- Parallella operationer: 12

FLASKHALSAR:
1. Ranking queries utan index (förbättring: 78%)
2. E-postköhantering sekventiell (förbättring: 45%)
```

### E-postsammanfattning
```
E-POST STATISTIK:
Template         | Skickade | Verifierade | Fel
-----------------|----------|-------------|----
request          | 523      | 523         | 0
reminder         | 187      | 187         | 0  
confirmation     | 203      | 203         | 0
position_filled  | 89       | 87          | 2
TOTALT          | 1,002    | 1,000       | 2

Felaktiga e-post:
- position_filled till musiker #45: Fel projektnamn
- position_filled till musiker #67: Token saknades
```

## 🚀 Körningsinstruktioner

### Installation
```bash
# Installera beroenden
npm install --save-dev @types/jest jest ts-jest

# Skapa test-script i package.json
"scripts": {
  "stress-test": "ts-node scripts/stress-test-requests.ts",
  "stress-test:watch": "nodemon scripts/stress-test-requests.ts",
  "stress-test:verbose": "DEBUG=* ts-node scripts/stress-test-requests.ts"
}
```

### Körning
```bash
# Kör alla tester
npm run stress-test

# Kör specifik kategori
npm run stress-test -- --category=conflicts

# Kör med detaljerad loggning
npm run stress-test -- --verbose

# Kör utan att rensa testdata
npm run stress-test -- --no-cleanup

# Kör specifikt scenario
npm run stress-test -- --scenario="Sequential Complete Flow"

# Generera HTML-rapport
npm run stress-test -- --report=html
```

### Miljövariabler
```env
# För testmiljö
STRESS_TEST_DB_URL=postgresql://...
STRESS_TEST_MOCK_EMAIL=true
STRESS_TEST_TIME_FACTOR=100  # Snabba upp tid 100x
STRESS_TEST_LOG_LEVEL=info
```

## 🔧 Underhåll

### Lägga till nya tester
1. Skapa scenario i `test-scenarios.ts`
2. Lägg till hjälpfunktioner i `test-helpers.ts` om behövs
3. Uppdatera rapportgeneratorn för nya metrics
4. Dokumentera här

### Felsökning
- Se `logs/stress-test-[datum].log` för detaljer
- Kör med `--verbose` för realtidsloggning
- Använd `--no-cleanup` för att inspektera testdata

### Best practices
1. Alltid kör tester innan release
2. Lägg till test för varje ny feature
3. Håll tester isolerade (ingen delad state)
4. Mocka externa tjänster (e-post, tid)
5. Verifiera både positiva och negativa fall

## 📈 Framtida förbättringar

1. **CI/CD Integration**
   - Kör automatiskt vid PR
   - Blockera merge om tester misslyckas

2. **Load testing**
   - Simulera 10,000+ musiker
   - Testa skalbarhet

3. **Chaos testing**
   - Random failures
   - Nätverkslatens
   - Database timeouts

4. **Visual regression**
   - Screenshot olika tillstånd
   - Jämför mot baseline

---

**VIKTIGT**: Detta testsystem är kritiskt för systemets tillförlitlighet. Alla ändringar i förfrågningslogiken MÅSTE verifieras med dessa tester!

*Senast uppdaterad: 2025-06-28*
*Skapad av: Claude & Användare*