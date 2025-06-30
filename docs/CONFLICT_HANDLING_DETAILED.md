# Detaljerad Konflikthantering - Musiker på flera listor

## Problemet
När ett projekt har behov för flera positioner (t.ex. 1:a konsertmästare, 2:a konsertmästare, Tutti violin) kan samma musiker finnas på rankningslistorna för flera av dessa positioner. Detta skapar potentiella konflikter där en musiker kan få flera förfrågningar för samma projekt.

> **KRITISKT**: För detaljerad implementation av hur systemet förhindrar flera förfrågningar per musiker, se [REQUEST_FILTERING_LOGIC.md](./REQUEST_FILTERING_LOGIC.md)

**Exempel:**
- Daniel Migdal finns på både A-listan för 1:a konsertmästare och B-listan för 2:a konsertmästare
- Maria Svensson finns på både A-listan för 1:a konsertmästare och C-listan för Tutti violin

## Beslutad Lösning - Implementering med valbara strategier

### Grundprincip
Systemet erbjuder tre olika strategier för konflikthantering som kan väljas i Systeminställningar. Detta ger flexibilitet utan att komplicera standardanvändningen.

### De tre strategierna

#### 1. Enkel (standard)
- **Beskrivning**: Visar endast varning. Först till kvarn-principen gäller.
- **UI**: Visar varningsikon: "⚠️ Daniel Migdal finns på flera listor"
- **Logik**: 
  - Systemet skickar förfrågningar i den ordning de processas
  - Om en musiker får en förfrågan för en position, hoppas de automatiskt över för andra positioner
  - Ingen manuell intervention krävs
- **Fördelar**: Enkel och ren implementation, ingen överraskning för användaren

#### 2. Detaljerad förhandsvisning
- **Beskrivning**: Visar potentiella konflikter och realtidsinformation när förfrågningar skickas
- **UI**: Utökad förhandsvisning med lista över alla konflikter
- **Logik**:
  - Som "Enkel" men med utökad information
  - Visar exakt vilka musiker som kan påverkas
  - Realtidsuppdateringar när förfrågningar skickas
- **Fördelar**: Full transparens, användaren ser exakt vad som händer

#### 3. Smart position-matchning
- **Beskrivning**: Prioriterar automatiskt den position där musikern rankas högst
- **UI**: Automatisk prioritering visas i förhandsvisningen
- **Logik**:
  - Analyserar musikerns ranking på varje lista
  - Skickar endast förfrågan för den position där musikern har bäst ranking
  - Om lika ranking, prioritera hierarkiskt högre position
- **Fördelar**: Optimerar chansen att få rätt musiker på rätt plats

### UI-implementation i Systeminställningar

```
Konflikthantering för musiker på flera listor:

○ Enkel (standard)
   Visar endast varning. Först till kvarn-principen gäller.

○ Detaljerad förhandsvisning
   Visar potentiella konflikter och realtidsinformation när förfrågningar skickas.

○ Smart position-matchning
   Prioriterar automatiskt den position där musikern rankas högst.

[ℹ️ Läs mer om de olika alternativen]
```

### Förhandsvisning med varning (exempel)

```
📋 Förfrågningar kommer skickas för:

1:a konsertmästare (3 platser)
- Sequential strategi
- 48 timmars svarstid

2:a konsertmästare (2 platser)
- Parallel strategi
- 48 timmars svarstid

⚠️ Följande musiker finns på flera listor:
• Daniel Migdal (1:a konsertmästare, 2:a konsertmästare)
• Maria Svensson (1:a konsertmästare, Tutti violin)

ℹ️ Du kan ändra konflikthantering i Systeminställningar

[Skicka förfrågningar] [Avbryt]
```

## Teknisk Implementation

### 1. Databas
```sql
-- Lägg till i Settings-tabellen
INSERT INTO "Setting" (key, value, description) VALUES 
('conflict_handling_strategy', 'simple', 'Strategi för hantering av musiker på flera listor');

-- För framtida per-projekt override
ALTER TABLE "Project" ADD COLUMN "allowMultipleRequests" BOOLEAN DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "overrideConflictStrategy" TEXT;
```

### 2. API Logik
```typescript
// /api/projects/[id]/conflicts
async function detectConflicts(projectId: number) {
  // Hämta alla projektbehov med deras rankningslistor
  const needs = await prisma.projectNeed.findMany({
    where: { projectId },
    include: {
      position: true,
      rankingList: {
        include: {
          rankings: {
            include: {
              musician: true
            }
          }
        }
      }
    }
  });

  // Bygg en map av musiker -> positioner
  const musicianPositions = new Map();
  
  needs.forEach(need => {
    need.rankingList?.rankings.forEach(ranking => {
      const key = ranking.musicianId;
      if (!musicianPositions.has(key)) {
        musicianPositions.set(key, []);
      }
      musicianPositions.get(key).push({
        position: need.position,
        ranking: ranking.position,
        needId: need.id
      });
    });
  });

  // Hitta musiker som finns på flera listor
  const conflicts = [];
  musicianPositions.forEach((positions, musicianId) => {
    if (positions.length > 1) {
      conflicts.push({
        musicianId,
        positions
      });
    }
  });

  return conflicts;
}
```

### 3. Strategihantering vid sändning
```typescript
async function handleConflicts(conflicts, strategy) {
  switch(strategy) {
    case 'simple':
      // Returnera bara konflikterna för visning
      return { showWarning: true, conflicts };
    
    case 'detailed':
      // Returnera utökad information
      return {
        showDetailedPreview: true,
        conflicts: conflicts.map(c => ({
          ...c,
          recommendation: calculateRecommendation(c)
        }))
      };
    
    case 'smart':
      // Automatisk prioritering
      return {
        autoResolve: true,
        resolutions: conflicts.map(c => ({
          musicianId: c.musicianId,
          selectedPosition: selectBestPosition(c.positions)
        }))
      };
  }
}
```

## Framtida utökningar

### Per-projekt inställningar
```typescript
// I projektinställningar
interface ProjectSettings {
  allowMultipleRequests: boolean; // Tillåt flera förfrågningar per musiker
  overrideConflictStrategy?: 'simple' | 'detailed' | 'smart'; // Override global inställning
}
```

### Use cases för "Tillåt flera förfrågningar"
1. **Utbildningsprojekt**: Där man vill ge musiker möjlighet att välja nivå
2. **Stora produktioner**: Där samma musiker kan ha olika roller i olika delar
3. **Flexibla projekt**: Där musikerns preferens är viktigast

## Fördelar med denna approach

### 1. Progressiv komplexitet
- Börjar enkelt för nya användare
- Avancerade funktioner tillgängliga vid behov
- Ingen steep learning curve

### 2. Användarvänligt
- Ingen överraskningar med standardinställningen
- Tydlig information om vad som händer
- Möjlighet att ändra beteende utan att förstå tekniska detaljer

### 3. Framtidssäkert
- Lätt att lägga till fler strategier
- Kan ha olika inställningar per projekt
- Möjligt att lägga till AI-baserad optimering senare

### 4. Transparent
- Användaren ser alltid vad som händer
- Ingen "svart låda" där beslut tas utan insyn
- Alla val kan förklaras och motiveras

## Implementation Timeline

1. **Fas 1**: Implementera grundläggande konfliktdetektering
2. **Fas 2**: Lägg till de tre strategierna i systeminställningar
3. **Fas 3**: Implementera UI för varningar och förhandsvisning
4. **Fas 4**: Lägg till per-projekt overrides
5. **Fas 5**: Optimera och finjustera baserat på användning

## Testscenarier

### Scenario 1: Standard användning
- Projekt med 3 positioner
- 2 musiker på flera listor
- Förväntat: Varning visas, först-till-kvarn gäller

### Scenario 2: Smart prioritering
- Musiker A: Rank 1 på Konsertmästare, Rank 5 på Tutti
- Förväntat: Skickas endast för Konsertmästare

### Scenario 3: Per-projekt override
- Global: Simple
- Projekt: allowMultipleRequests = true
- Förväntat: Alla får förfrågningar för alla positioner

---

*Detta dokument uppdaterades: 2025-06-28*
*Beslut taget av: Användare och Claude i samarbete*