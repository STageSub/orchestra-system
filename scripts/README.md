# Orchestra System Stress Test Suite

Detta är ett omfattande testsystem för att verifiera att förfrågningssystemet fungerar korrekt under alla möjliga scenarier.

## 🚀 Snabbstart

```bash
# Kör alla tester
npm run stress-test

# Kör med detaljerad loggning
npm run stress-test:verbose

# Kör utan att rensa testdata (för debugging)
npm run stress-test:no-cleanup

# Generera HTML-rapport
npm run stress-test:report
```

## 📋 Vad testas?

### 1. Strategitester
- **Sequential**: En musiker i taget
- **Parallel**: Håller rätt antal aktiva förfrågningar
- **First Come**: Respekterar maxRecipients

### 2. Konflikthantering
- Musiker på flera listor får bara EN förfrågan
- Avböjda musiker exkluderas från hela projektet
- Konfliktvarningar visas korrekt

### 3. E-postflöden
- Initial förfrågan med korrekt innehåll
- Påminnelser vid 75% av svarstiden
- Bekräftelse vid acceptans
- Position fylld-notifikationer

### 4. Timeouthantering
- Status ändras till 'timed_out' (inte 'declined')
- Nästa musiker kontaktas automatiskt
- Ingen dubbel timeout-hantering

### 5. Statistik
- Projektstatistik stämmer
- Musikerstatistik spåras korrekt
- Svarsfrekvens beräknas rätt

## 🎯 Avancerade användningsfall

### Köra specifik kategori
```bash
npm run stress-test -- --category=conflicts
```

### Köra specifikt scenario
```bash
npm run stress-test -- --scenario="Sequential Complete Flow"
```

### Generera olika rapportformat
```bash
# Console (standard)
npm run stress-test

# HTML rapport
npm run stress-test -- --report=html

# JSON rapport
npm run stress-test -- --report=json
```

## 📊 Rapporter

Rapporter sparas i `/stress-test-reports/` mappen:
- HTML: Visuell rapport med grafer och tabeller
- JSON: Maskinläsbar data för vidare analys

## 🔧 Felsökning

### Tester misslyckas
1. Kör med `--verbose` för mer information
2. Använd `--no-cleanup` för att inspektera testdata
3. Kontrollera loggfiler i konsolen

### Databasproblem
- Säkerställ att alla migrations är körda
- Kontrollera att email templates finns

### Timeout-problem
- Tester använder simulerad tid (100x snabbare)
- Justera `TIME_FACTOR` i miljövariabler vid behov

## 🏗️ Arkitektur

```
scripts/
├── stress-test-requests.ts    # Huvudorkestrator
├── test-scenarios.ts          # Alla testfall
├── test-helpers.ts            # Hjälpfunktioner
├── test-email-mock.ts         # E-postmock
└── test-report-generator.ts   # Rapportgenerering
```

## 📝 Exempel på testutdata

```
🚀 Orchestra System Stress Test
================================
Test ID: TEST_LQX8K_ABC
Date: 2025-06-28T14:32:15.123Z

📋 Setting up test environment...
📧 Initializing email mock...
🏃 Running test scenarios...

✅ Strategy Tests - Sequential sends to one at a time
✅ Strategy Tests - Sequential handles declined correctly
✅ Conflict Handling - Musician on multiple lists gets one request
❌ Email Flow - Reminder at 75% of response time
   Error: Expected same token 'abc123', got 'xyz789'

📊 Generating report...
🧹 Cleaning up test data...

📈 Summary
==========
Total tests: 45
Passed: 44 (97.8%)
Failed: 1
Duration: 127.4s
```

## 🔄 Kontinuerlig förbättring

Nya tester läggs till när:
- Nya features implementeras
- Buggar upptäcks och fixas
- Edge cases identifieras

Håll alltid testerna uppdaterade!