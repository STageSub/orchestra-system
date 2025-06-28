# Förfrågningsstrategier - VIKTIG DOKUMENTATION

Detta dokument beskriver de tre förfrågningsstrategierna i systemet. Det är **KRITISKT** att dessa implementeras korrekt.

## 1. SEKVENTIELL (sequential)

### Beskrivning
- Fråga **en musiker i taget** i rankningsordning
- Vänta på svar innan nästa musiker kontaktas
- Ingen `maxRecipients` parameter används

### Exempel
**Behov**: 3 violinister från A-listan

1. Skicka förfrågan till musiker #1
2. Vänta på svar
   - Om JA → en plats fylld, skicka till musiker #2
   - Om NEJ → skicka till musiker #2
3. Fortsätt tills alla 3 platser är fyllda

## 2. PARALLELL (parallel)

### Beskrivning
- Håll **alltid** antal aktiva förfrågningar = antal behov
- **Kräver minst 2 behov** (annars använd sekventiell)
- Formel: `Ja-svar + Väntande svar = Antal behov`
- När någon tackar NEJ → automatiskt skicka till nästa på listan
- När någon tackar JA → INGEN ny förfrågan skickas
- Ingen `maxRecipients` parameter används

### Exempel
**Behov**: 5 violinister från B-listan

1. **Start**: Skicka förfrågan till musiker #1-5
   - Status: 0 ja-svar, 5 väntande

2. **Musiker #2 svarar NEJ**:
   - Automatiskt skicka förfrågan till musiker #6
   - Status: 0 ja-svar, 5 väntande

3. **Musiker #1 svarar JA**:
   - INGEN ny förfrågan skickas
   - Status: 1 ja-svar, 4 väntande

4. **Musiker #3 svarar JA**:
   - INGEN ny förfrågan skickas
   - Status: 2 ja-svar, 3 väntande

5. **Musiker #4 svarar NEJ**:
   - Automatiskt skicka förfrågan till musiker #7
   - Status: 2 ja-svar, 3 väntande

Fortsätter tills alla 5 platser är fyllda.

### Viktigt att komma ihåg
- Antalet aktiva förfrågningar minskar när någon tackar JA
- Antalet aktiva förfrågningar bibehålls när någon tackar NEJ (ny skickas automatiskt)

## 3. FÖRST TILL KVARN (first_come)

### Beskrivning
- Skicka förfrågan till X antal musiker samtidigt (från toppen av listan)
- `maxRecipients` parameter är valfri:
  - Om angivet: måste vara >= antal behov
  - Om tomt/null: skickar till HELA rankningslistan
- Ingen påfyllning vid nej-svar
- De första som tackar ja får jobbet
- När alla platser är fyllda → meddela övriga att tjänsten är tillsatt

### Exempel
**Behov**: 5 violinister från C-listan
**maxRecipients**: 10

1. Skicka förfrågan till musiker #1-10 samtidigt
2. De första 5 som svarar JA får jobbet
3. När 5 platser är fyllda:
   - Skicka "tjänsten är tillsatt" till övriga som inte svarat
   - Skicka "tjänsten är tillsatt" till de som svarade JA efter att platserna fyllts

### Exempel 2 - Utan maxRecipients
**Behov**: 2 cellister från A-listan
**maxRecipients**: (tomt)

1. Skicka förfrågan till ALLA på A-listan samtidigt
2. De första 2 som svarar JA får jobbet
3. Övriga meddelas att tjänsten är tillsatt

### Användningsfall
Bra när:
- Tidskritiska behov
- Man vill ge fler chansen men begränsa antalet
- Man har 30 på listan men vill bara fråga de 10 bästa
- Eller: fråga hela listan när det är bråttom

## Implementation i kod

### ProjectNeed modell (Prisma)
```prisma
model ProjectNeed {
  requestStrategy String  // "sequential", "parallel", "first_come"
  maxRecipients   Int?    // Endast för "first_come" strategy
  quantity        Int     // Antal musiker som behövs
  // ... övriga fält
}
```

### Validering
- För `sequential`: `maxRecipients` ska vara null
- För `parallel`: 
  - `maxRecipients` ska vara null
  - `quantity` måste vara >= 2
- För `first_come`: 
  - `maxRecipients` är valfritt
  - Om angivet: måste vara >= `quantity`
  - Om tomt/null: använder hela listan

## Felaktiga implementationer att undvika

❌ **FEL**: Visa maxRecipients för parallel strategi
✅ **RÄTT**: maxRecipients används ENDAST för first_come

❌ **FEL**: Parallel strategi där nya förfrågningar skickas när någon tackar ja
✅ **RÄTT**: Parallel strategi där nya förfrågningar ENDAST skickas när någon tackar nej

❌ **FEL**: First_come där man fyller på med nya när någon tackar nej
✅ **RÄTT**: First_come skickar till X personer en gång, ingen påfyllning

## Implementation Status (2025-06-26)

### ✅ Verifierad och fungerande implementation

#### Sequential Strategy
- Fungerar korrekt - skickar till en musiker i taget
- Väntar på svar innan nästa kontaktas

#### Parallel Strategy
- **FIXAD**: Nu skickas korrekt antal requests direkt vid första försöket
- Använder `Promise.allSettled` för parallell exekvering
- Formel fungerar: `Accepted + Pending = Quantity`
- Vid NEJ-svar skickas automatiskt till nästa musiker

#### First Come Strategy
- **FIXAD**: När maxRecipients är null skickas nu till ALLA musiker på listan
- **FIXAD**: När någon accepterar och behov fylls, markeras alla pending som "cancelled"
- Cancelled-musiker får notification om att tjänsten är fylld

### Tekniska detaljer om fixarna

1. **Problem**: Requests skickades sekventiellt med await i loop
   - **Lösning**: `Promise.allSettled` för parallell exekvering

2. **Problem**: `createAndSendRequest` returnerade void och fel kunde inte spåras
   - **Lösning**: Returnerar nu boolean (true/false) för status tracking

3. **Problem**: Test-systemet hade egen implementation som inte matchade produktion
   - **Lösning**: Test-systemet använder nu samma `sendRequests` funktion

### Kodfiler som uppdaterats
- `/lib/request-strategies.ts` - Huvudlogiken för alla strategier
- `/app/api/test/create-request/route.ts` - Test-systemet
- `/app/api/test/simulate-response/route.ts` - Cancelled-logik för first_come