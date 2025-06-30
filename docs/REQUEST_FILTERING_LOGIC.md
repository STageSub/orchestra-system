# Request Filtering Logic - Kritisk Implementation

## 🚨 KRITISKT PROBLEM IDENTIFIERAT (2025-06-28)

### Problemet
Systemet tillåter idag att samma musiker får flera förfrågningar för olika positioner i samma projekt. Detta är ett allvarligt fel som bryter mot grundläggande affärsregler.

**Exempel på problemet:**
- Daniel Migdal finns på A-listan för 1:a konsertmästare
- Daniel Migdal finns också på B-listan för 2:a konsertmästare
- När förfrågningar skickas för båda positioner får Daniel TVÅ förfrågningar för samma projekt
- Detta skapar förvirring och är inte tillåtet enligt affärslogiken

### Affärsregler som MÅSTE följas

#### Regel 1: En musiker - En förfrågan per projekt
- En musiker kan bara ha EN aktiv (pending) eller accepterad förfrågan per projekt
- Detta gäller oavsett position eller instrument
- När en musiker har en väntande förfrågan för projektet ska de INTE få fler förfrågningar

#### Regel 2: Tackat nej = Inga fler förfrågningar
- Om en musiker tackat nej (declined) till en position i projektet
- Ska de INTE tillfrågas för andra positioner i samma projekt
- De har redan indikerat att de inte är tillgängliga för projektet

#### Regel 3: Timeout räknas som nej
- Om en förfrågan går ut (timed_out)
- Behandla det som att musikern tackat nej
- Inga fler förfrågningar för detta projekt

## 📋 DETALJERAD LÖSNING

### Steg 1: Uppdatera getAvailableMusicians funktionen

**Nuvarande signatur:**
```typescript
async function getAvailableMusicians(
  projectNeedId: number,
  positionId: number,
  rankingListId?: number,
  requireLocalResidence: boolean = false
)
```

**Ny signatur:**
```typescript
async function getAvailableMusicians(
  projectNeedId: number,
  projectId: number, // NY PARAMETER
  positionId: number,
  rankingListId?: number,
  requireLocalResidence: boolean = false
)
```

**Ny filtreringslogik:**
```typescript
// 1. Hämta alla musiker som redan har förfrågningar för detta projekt
const musiciansWithRequests = await prisma.request.findMany({
  where: {
    projectNeed: {
      projectId: projectId
    },
    status: {
      in: ['pending', 'accepted', 'declined', 'timed_out']
    }
  },
  select: {
    musicianId: true,
    status: true
  }
})

// 2. Skapa en Set med musiker som ska exkluderas
const excludedMusicianIds = new Set(
  musiciansWithRequests.map(r => r.musicianId)
)

// 3. Lägg till detta i baseWhere
const baseWhere = {
  isActive: true,
  id: {
    notIn: Array.from(excludedMusicianIds)
  },
  qualifications: {
    some: {
      positionId
    }
  },
  ...(requireLocalResidence && { localResidence: true })
}
```

### Steg 2: Uppdatera sendRequests funktionen

**Ta bort lokal filtrering:**
```typescript
// REMOVE THIS CODE (rad 65-71):
const existingMusicianIds = existingRequests.map(r => r.musicianId)
const availableMusicians = musiciansToRequest.filter(
  m => !existingMusicianIds.includes(m.id)
)

// REPLACE WITH:
const availableMusicians = musiciansToRequest
// Filtreringen sker nu i getAvailableMusicians
```

**Skicka projektId:**
```typescript
const musiciansToRequest = await getAvailableMusicians(
  projectNeedId,
  projectNeed.projectId, // NY PARAMETER
  projectNeed.position.id,
  rankingListId,
  projectNeed.requireLocalResidence || false
)
```

### Steg 3: Hantera konfliktstrategier

**Läs strategi från settings:**
```typescript
// I sendRequests eller send-all-requests
const settingResult = await prisma.setting.findUnique({
  where: { key: 'ranking_conflict_strategy' }
})
const conflictStrategy = settingResult?.value || 'simple'
```

**Implementera strategierna:**

#### Simple (standard) - Först till kvarn
```typescript
if (conflictStrategy === 'simple') {
  // Nuvarande implementation
  // Musiker som redan har förfrågan hoppas över automatiskt
  // Ingen extra logik behövs
}
```

#### Detailed - Visa information
```typescript
if (conflictStrategy === 'detailed') {
  // Visa vilka musiker som hoppades över pga konflikter
  const skippedDueToConflicts = []
  for (const musician of excludedMusicians) {
    const existingRequest = await prisma.request.findFirst({
      where: {
        musicianId: musician.id,
        projectNeed: { projectId }
      },
      include: {
        projectNeed: {
          include: { position: true }
        }
      }
    })
    if (existingRequest) {
      skippedDueToConflicts.push({
        musician,
        existingPosition: existingRequest.projectNeed.position,
        status: existingRequest.status
      })
    }
  }
  // Returnera denna info för visning i UI
}
```

#### Smart - Prioritera baserat på ranking
```typescript
if (conflictStrategy === 'smart') {
  // För varje musiker med konflikt
  // Jämför deras ranking på olika listor
  // Skicka endast för den position där de rankas högst
  // Implementation kommer senare
}
```

## 🧪 TESTSCENARIER

### Test 1: Grundläggande konflikt
1. Skapa projekt med 2 behov (1:a och 2:a konsertmästare)
2. Lägg Daniel på båda listor
3. Skicka förfrågningar
4. **Förväntat**: Daniel får ENDAST en förfrågan (för den första positionen)

### Test 2: Tackat nej
1. Daniel tackar nej till 1:a konsertmästare
2. Skicka förfrågningar för 2:a konsertmästare
3. **Förväntat**: Daniel får INGEN ny förfrågan

### Test 3: Timeout
1. Daniels förfrågan för 1:a konsertmästare går ut (timeout)
2. Skicka förfrågningar för 2:a konsertmästare
3. **Förväntat**: Daniel får INGEN ny förfrågan

### Test 4: Accepterat
1. Daniel accepterar 1:a konsertmästare
2. Skicka förfrågningar för 2:a konsertmästare
3. **Förväntat**: Daniel får INGEN ny förfrågan (redan accepterat för projektet)

## ⚠️ VIKTIGA ÖVERVÄGANDEN

### Performance
- Den nya filtreringen kräver en extra databas-query
- Detta är acceptabelt för korrekt funktionalitet
- Kan optimeras med index på projectNeed.projectId om det blir problem

### Bakåtkompatibilitet
- Ändringen påverkar inte befintliga förfrågningar
- Gäller endast nya förfrågningar som skickas

### Edge cases
1. **Olika projekt**: Musiker kan fortfarande få förfrågningar för olika projekt
2. **Cancelled status**: Behandlas som att förfrågan aldrig skickats
3. **Arkiverade musiker**: Filtreras redan bort av isActive = true

## 📊 DATAFLÖDE

```
1. Admin klickar "Skicka förfrågningar"
   ↓
2. sendRequests anropas med projectNeedId
   ↓
3. Hämta projectId från projectNeed
   ↓
4. getAvailableMusicians(needId, projectId, positionId, ...)
   ↓
5. Filtrera bort musiker med befintliga förfrågningar för projektet
   ↓
6. Returnera endast tillgängliga musiker
   ↓
7. Skicka förfrågningar enligt vald strategi
```

## 🔧 IMPLEMENTATION CHECKLIST

- [ ] Uppdatera getAvailableMusicians med projektId parameter
- [ ] Implementera projekt-wide filtrering i getAvailableMusicians
- [ ] Uppdatera alla anrop till getAvailableMusicians
- [ ] Ta bort lokal filtrering i sendRequests
- [ ] Implementera konfliktstrategihantering
- [ ] Skapa tester för alla scenarios
- [ ] Uppdatera dokumentation
- [ ] Verifiera med riktiga data

---

**KRITISKT**: Denna implementation MÅSTE göras innan systemet kan användas i produktion!

*Dokumenterat: 2025-06-28*
*Problem identifierat av: Användare*
*Lösning designad av: Användare och Claude i samarbete*