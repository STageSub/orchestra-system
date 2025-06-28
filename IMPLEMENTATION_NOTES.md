# Implementation Notes - Orchestra System

This document tracks important implementation details and recent enhancements to the Orchestra System.

## Recent Enhancements (Phase 3)

### Project Model Enhancements
- **Added Notes Field**: The Project model in Prisma schema now includes an optional `notes` field (String?) for storing additional project information
- **Database Migration**: Applied migration to add the notes column to the Project table

### Project Management UI Updates

#### Project Creation Form
- Added a textarea field for project notes in the new project form
- Notes field is optional and supports multiline text input
- Located below the concert days field in the form layout

#### Project Editing Form
- Added notes field to the edit project form with same functionality as creation form
- Properly loads existing notes when editing a project
- Updates notes field when saving project changes

#### Project Details Page - Information Tab
The Information tab now displays comprehensive project details in two sections:

1. **Basic Information Section**:
   - Project Name
   - Start Date (formatted as Swedish date)
   - Week Number
   - Project Status (Active/Completed)

2. **Notes Section**:
   - Displays project notes if available
   - Shows "Inga anteckningar" (No notes) when notes field is empty
   - Notes are displayed with proper text formatting and line breaks preserved

### Project Overview Improvements

#### Intelligent Sorting System
Implemented a sophisticated sorting algorithm for the projects list:

1. **Upcoming Projects** (Status: Active):
   - Appear at the top of the list
   - Sorted in chronological order (earliest start date first)
   - Ensures the next upcoming project is always visible at the top

2. **Completed Projects**:
   - Appear below all upcoming projects
   - Sorted in reverse chronological order (most recent first)
   - Makes it easy to see recently completed projects

This sorting ensures optimal workflow where users can immediately see what's coming up next while still having easy access to recent project history.

## Technical Implementation Details

### Database Schema Changes
```prisma
model Project {
  // ... existing fields ...
  notes              String?
  // ... other fields ...
}
```

### API Endpoints Updated
- `POST /api/projects` - Now accepts notes field in request body
- `PATCH /api/projects/[id]` - Handles notes field updates

### UI Components
- Form components use standard textarea styling consistent with other form fields
- Information tab uses clean, card-based layout for better readability
- Empty state handling for notes field with appropriate Swedish messaging

## Code Quality Improvements
- Consistent use of Swedish language throughout the UI
- Proper TypeScript typing for all new fields
- Maintained existing code patterns and conventions
- No unnecessary comments added to codebase

## Testing Considerations
- Notes field properly handles:
  - Empty/null values
  - Long text with multiple paragraphs
  - Special characters and Swedish letters (å, ä, ö)
- Sorting algorithm tested with various combinations of active and completed projects
- Date formatting verified for Swedish locale

## Future Considerations
- Notes field is searchable if search functionality is added later
- Field size is unlimited (database String type)
- Could be enhanced with rich text editing if needed in future phases

---

## 2025-06-26 Updates (Phase 5)

### 1. Dashboard Statistik
**Problem**: Dashboard visade hårdkodade nollor istället för verklig data.

**Lösning**:
- Skapade `/api/dashboard/stats` endpoint
- Implementerade dynamisk datahämtning med React hooks
- Hämtar: totalt antal musiker, aktiva musiker, aktiva projekt, väntande svar, påminnelser, svarsfrekvens

**Filer**:
- `/app/admin/page.tsx` - Uppdaterad med useState och useEffect
- `/app/api/dashboard/stats/route.ts` - Ny API endpoint

### 2. Projekt-detaljvy Redesign
**Problem**: 
- Tabs-baserad layout var förvirrande
- "Visa"-knapparna var inte alignade
- Pausa-funktionalitet saknades
- Projektinformation (repetitionsschema, konsertinfo) visades inte

**Lösning**:
- Två-kolumns layout med CSS Grid
- Vänster kolumn: Projektinformation
- Höger kolumn: Kombinerad behov & förfrågningar vy
- Grid-baserad knapp-layout för konsekvent alignment

**Implementation**:
```tsx
// Grid layout för knappar
<div className="grid grid-cols-[auto_1fr_auto] gap-1 w-36 items-center">
  <div className="col-span-1">Visa/Skicka</div>
  <div className="col-span-1">Pausa/Redigera</div>
  <div className="col-span-1">Expand</div>
</div>
```

**API Mapping Fix**:
- Database field: `status` 
- Frontend expects: `needStatus`
- Lösning: Mappa i API response: `needStatus: need.status`

**Filer**:
- `/app/admin/projects/[id]/page.tsx` - Helt omskriven
- `/components/compact-needs-view.tsx` - Grid-baserad knapp-layout
- `/app/api/projects/[id]/needs/[needId]/status/route.ts` - Pausa/återuppta endpoint

### 3. Musikerprofil - Nya sektioner

#### 3.1 Rankningar
**Implementation**:
- Uppdaterade `/api/musicians/[id]` för att inkludera rankings med Prisma relations
- Gruppering efter instrument och position i UI
- Klickbara länkar till specifika rankningslistor

**Data struktur**:
```typescript
rankings: {
  include: {
    rankingList: {
      include: {
        position: {
          include: {
            instrument: true
          }
        }
      }
    }
  }
}
```

#### 3.2 Projekthistorik
**Implementation**:
- Ny endpoint: `/api/musicians/[id]/project-history`
- Hämtar alla Request records för musikern
- Grupperar efter projekt
- Sorterar efter projektdatum (nyaste först)

**Visar**:
- Projektnamn med länk
- Datum och veckonummer
- Status (Kommande/Genomfört)
- Position och svarsstatus för varje förfrågan

#### 3.3 Statistik
**Implementation**:
- Ny endpoint: `/api/musicians/[id]/statistics`
- Beräknar omfattande statistik från Request-tabellen

**Statistik inkluderar**:
- Totalt antal förfrågningar (accepterade/avböjda/väntande)
- Acceptansgrad (procentuell)
- Genomsnittlig svarstid i timmar/dagar
- Top 3 mest efterfrågade positioner
- Förfrågningar per år

**Filer**:
- `/app/admin/musicians/[id]/page.tsx` - Uppdaterad med alla tre sektioner
- `/app/api/musicians/[id]/route.ts` - Inkluderar rankings
- `/app/api/musicians/[id]/project-history/route.ts` - Ny endpoint
- `/app/api/musicians/[id]/statistics/route.ts` - Ny endpoint

## Tekniska detaljer

### Prisma Query Optimization
För att undvika N+1 queries använder vi nested includes:
```typescript
include: {
  rankings: {
    include: {
      rankingList: {
        include: {
          position: {
            include: {
              instrument: true
            }
          }
        }
      }
    }
  }
}
```

### Grid Layout för Alignment
Använder CSS Grid istället för Flexbox för konsekvent knapp-alignment:
```css
grid-template-columns: [auto 1fr auto]
```
Detta säkerställer att "Visa"-knappen alltid är i samma position oavsett om andra knappar visas.

### Error Handling
Alla nya API endpoints har try-catch med detaljerade felmeddelanden:
```typescript
catch (error) {
  console.error('Specific error context:', error)
  return NextResponse.json(
    { error: 'User-friendly error message' },
    { status: 500 }
  )
}
```

## Performance Considerations
- Dashboard stats använder Promise.all() för parallella databas-queries
- Projekthistorik grupperas i minnet istället för i databasen för flexibilitet
- Statistik-beräkningar görs på server-sidan för att minimera data transfer

---

## 2025-06-26 Updates - Request Strategy Fixes

### Problem 1: Ranking List Reorder Not Saving
**Symptom**: Drag-and-drop i rankningslistor återställdes direkt efter släpp
**Root Cause**: 
1. API returnerade tom error object "{}" vid fel
2. Databas unique constraint på [listId, rank] orsakade konflikt vid uppdatering

**Solution**:
```typescript
// Två-stegs uppdatering för att undvika constraint konflikt
await prisma.$transaction(async (tx) => {
  // Steg 1: Sätt alla till negativa rank värden
  await Promise.all(
    rankings.map((ranking, index) =>
      tx.ranking.update({
        where: { id: ranking.id },
        data: { rank: -(index + 1) }
      })
    )
  )
  
  // Steg 2: Uppdatera till korrekta rank värden
  const finalResults = await Promise.all(
    rankings.map((ranking) =>
      tx.ranking.update({
        where: { id: ranking.id },
        data: { rank: ranking.rank }
      })
    )
  )
})
```

**Files Modified**:
- `/app/api/rankings/[id]/reorder/route.ts` - Implementerade två-stegs transaktion

### Problem 2: Parallel Strategy Only Sending to 1 Musician
**Symptom**: 
- Parallel strategi med quantity=3 skickade bara till 1 musiker första gången
- När man simulerade NEJ-svar skickades korrekt antal (3)

**Root Cause**:
1. `createAndSendRequest` fångade alla fel men returnerade void
2. Try-catch i loop trodde alla requests lyckades även om de misslyckades
3. Requests skickades sekventiellt vilket kunde orsaka timeout

**Solution**:
```typescript
// Ändrade createAndSendRequest att returnera boolean
async function createAndSendRequest(projectNeedId: number, musicianId: number): Promise<boolean> {
  try {
    // ... create request ...
    return true
  } catch (error) {
    console.error(`Failed to send request to musician ${musicianId}:`, error)
    return false
  }
}

// Använd Promise.allSettled för parallell exekvering
const results = await Promise.allSettled(
  musiciansToSend.map(musician => createAndSendRequest(projectNeedId, musician.id))
)
```

**Files Modified**:
- `/lib/request-strategies.ts` - Promise.allSettled implementation

### Problem 3: First Come Strategy Not Sending to All
**Symptom**: När maxRecipients var null skickades bara till 1 musiker istället för alla

**Root Cause**: Fallback använde `quantity` istället för alla tillgängliga musiker

**Solution**:
```typescript
case 'first_come':
  if (pendingCount === 0) {
    // Use maxRecipients if specified, otherwise send to ALL available musicians
    const recipientCount = maxRecipients || availableMusicians.length
    musiciansToSend = availableMusicians.slice(0, recipientCount)
  }
  break
```

### Problem 4: Test System Not Using Same Logic
**Symptom**: Test-systemet skapade bara 1 request oavsett strategi

**Root Cause**: `/api/test/create-request` hade egen implementation som inte respekterade strategier

**Solution**: Uppdaterade test-systemet att använda samma `sendRequests` funktion:
```typescript
// Använd samma sendRequests som produktionssystemet
await sendRequests({
  projectNeedId: need.id,
  strategy: need.requestStrategy as 'sequential' | 'parallel' | 'first_come',
  quantity: need.quantity,
  maxRecipients: need.maxRecipients || undefined,
  rankingListId: need.rankingListId || undefined
})
```

**Files Modified**:
- `/app/api/test/create-request/route.ts` - Nu använder sendRequests

### Problem 5: First Come Not Cancelling Pending When Filled
**Symptom**: När någon accepterade i First Come fortsatte andra vara "pending"

**Solution**: Implementerade cancelled-logik i test-systemet:
```typescript
if (acceptedCount >= quantity && strategy === 'first_come') {
  // Cancel all pending requests
  await prisma.request.updateMany({
    where: {
      projectNeedId: updatedProjectNeed!.id,
      status: 'pending'
    },
    data: { 
      status: 'cancelled',
      respondedAt: new Date()
    }
  })
}
```

**Files Modified**:
- `/app/api/test/simulate-response/route.ts` - Cancelled logic
- `/app/admin/test-requests/page.tsx` - UI för cancelled status
- `/app/api/test/stats/route.ts` - Inkluderar cancelled i statistik

### Technical Details

#### Promise.allSettled vs Sequential await
**Tidigare** (sekventiellt - långsamt):
```typescript
for (const musician of musiciansToSend) {
  await createAndSendRequest(projectNeedId, musician.id)
}
```

**Nu** (parallellt - snabbt):
```typescript
const results = await Promise.allSettled(
  musiciansToSend.map(musician => createAndSendRequest(projectNeedId, musician.id))
)
```

Detta säkerställer att alla requests skickas samtidigt och ingen timeout påverkar andra.

#### Test Response Times
Lade till korta svarstider för testning:
- 1 minut (0.017 timmar)
- 3 timmar

Finns i både `AddProjectNeedModal` och `EditProjectNeedModal`.

### Lessons Learned
1. **Always return status from async operations** - Void functions gör det svårt att veta om något misslyckades
2. **Use Promise.allSettled for parallel operations** - Undvik sekventiell väntan när operationer är oberoende
3. **Test system should use production logic** - Duplicerad kod leder till olika beteende
4. **Database constraints need careful handling** - Unique constraints kräver ofta två-stegs uppdateringar