# Konflikthantering Implementation - 2025-06-29

## Översikt
Detta dokument beskriver den fullständiga implementationen av konflikthantering för musiker som finns på flera rankningslistor.

## Problem som löstes
När ett projekt har flera positioner (t.ex. 1:a konsertmästare och 2:a konsertmästare) kunde samma musiker få flera förfrågningar om de fanns på båda listorna. Detta skapade förvirring och bröt mot affärslogiken.

## Implementerad lösning

### 1. Tre valbara strategier i Systeminställningar

#### Enkel (standard)
- Använder "först till kvarn"-principen
- När en musiker får en förfrågan för en position hoppas de automatiskt över för andra positioner
- Enkel och transparent implementation

#### Detaljerad förhandsvisning
- Som "Enkel" men med utökad loggning
- Visar alla konflikter i konsolen vid utskick
- Ger full transparens för administratörer

#### Smart position-matchning
- Analyserar var varje musiker rankas högst
- Skickar endast förfrågan för den position där musikern har bäst ranking
- Vid lika ranking prioriteras hierarkiskt högre position
- Optimerar chansen att få rätt musiker på rätt plats

### 2. ConflictWarning komponenten

Visar nu:
- Vilka musiker som finns på flera listor
- Vilken konflikthanteringsstrategi som är aktiv
- Tydlig förklaring av hur den valda strategin fungerar

Komponenten visas:
- I projektdetaljvyn (direkt synlig)
- I förhandsgranskningsmodalen för utskick

### 3. Teknisk implementation

#### request-strategies.ts
```typescript
// Ny hjälpfunktion för konfliktanalys
async function analyzeConflictsForProject(projectId: number, currentNeedId: number)

// Uppdaterad sendRequests med strategihantering
- Läser aktiv strategi från settings
- Tillämpar smart filtrering om aktiverad
- Loggar konflikter för detailed strategi
```

#### preview-all-requests API
- Synkroniserad med faktisk filtrering
- Använder samma projekt-wide filtrering
- Tillämpar smart strategi i förhandsgranskning

#### Projekt-wide filtrering
- getAvailableMusicians filtrerar nu på projektnivå
- Förhindrar att musiker får flera förfrågningar för samma projekt
- Respekterar declined och timed_out status

### 4. UI/UX förbättringar

#### ConflictWarning
- Blå informationsruta visar aktiv strategi
- Expanderbar lista med berörda musiker
- Länk till systeminställningar

#### SendAllRequestsPreviewModal
- Grön informationsruta när smart strategi är aktiv
- Tydlig förklaring av strategins funktion

## Resultat

### Före
- Musiker kunde få flera förfrågningar för samma projekt
- Ingen varning om potentiella konflikter
- Ingen möjlighet att styra beteendet

### Efter
- Projekt-wide filtrering förhindrar dubbletter
- Tydliga varningar när konflikter upptäcks
- Tre valbara strategier för olika användningsfall
- Full transparens i både UI och loggning

## Testning

För att testa implementationen:

1. Skapa ett projekt med flera positioner
2. Lägg samma musiker på flera rankningslistor
3. Testa olika strategier i Systeminställningar:
   - **Enkel**: Musiker får bara en förfrågan (första positionen)
   - **Detaljerad**: Se loggning i konsolen om konflikter
   - **Smart**: Musiker tillfrågas endast för sin bästa position

## Filer som ändrades

1. `/lib/request-strategies.ts` - Huvudlogik för strategihantering
2. `/app/api/projects/[id]/preview-all-requests/route.ts` - Synkad preview
3. `/components/conflict-warning.tsx` - Visar strategi och förklaring
4. `/components/send-all-requests-preview-modal.tsx` - UI feedback
5. `/app/admin/projects/[id]/page.tsx` - Lade till ConflictWarning

## Nästa steg

Systemet är nu fullt funktionellt med konflikthantering. Återstående förbättringar:
- Integrera toast-notifikationer bättre
- Lägg till loading states på fler ställen
- Implementera SSE för realtidsuppdateringar