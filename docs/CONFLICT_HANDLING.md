# Konflikthantering - Musiker på flera rankningslistor

> **OBS!** För den senaste och mest detaljerade versionen av konflikthanteringen, se [CONFLICT_HANDLING_DETAILED.md](./CONFLICT_HANDLING_DETAILED.md)

## Problem
När ett projekt har flera behov för olika positioner inom samma instrument (t.ex. både Konsertmästare och Tutti violinist), kan samma musiker finnas på rankningslistorna för båda positionerna. Detta skapar en konflikt där musikern potentiellt kan få flera förfrågningar för samma projekt.

## Lösning
Systemet erbjuder tre olika strategier för att hantera dessa konflikter, som kan konfigureras i Systeminställningar:

### 1. Endast varning (Standard)
- **Hur det fungerar**: När en musiker finns på flera listor visas en informationsikon (ℹ️) bredvid deras namn
- **Fördelar**: 
  - Enkel implementation
  - Admin har full kontroll
  - Ingen automatik som kan orsaka oväntade resultat
- **Nackdelar**: 
  - Kräver manuell hantering av varje konflikt
  - Risk för mänskliga misstag

### 2. Visa dialogruta för prioritering
- **Hur det fungerar**: När "Skicka förfrågningar" klickas och konflikter finns, visas en dialogruta där admin kan välja prioriterad position för varje musiker med konflikt
- **Fördelar**:
  - Systematisk hantering av alla konflikter samtidigt
  - Admin behåller kontrollen men med bättre översikt
  - Minskar risken för misstag
- **Nackdelar**:
  - Extra steg i arbetsflödet
  - Kan bli många val om många konflikter

### 3. Skicka till alla positioner
- **Hur det fungerar**: Musiker får förfrågningar för alla positioner de är kvalificerade för och kan själva välja
- **Fördelar**:
  - Ingen manuell hantering krävs
  - Musiker får själva välja sin preferens
  - Maximerar chansen att fylla alla positioner
- **Nackdelar**:
  - Musiker kan bli förvirrade av flera förfrågningar
  - Risk att musiker tackar ja till "fel" position ur orkesterns perspektiv

## Implementation

### Databas
Ingen ändring krävs i databasen. Konflikter identifieras genom att köra en query som hittar musiker som finns i flera ProjectNeeds för samma projekt.

### API
- `/api/projects/[id]/conflicts` - Returnerar lista över musiker med konflikter
- `/api/settings` - Hanterar sparande av vald strategi

### Frontend
- **Settings-sidan**: Dropdown för att välja strategi
- **Projektvy**: 
  - Varningsikoner vid strategy = 'warning_only'
  - Prioriteringsdialog vid strategy = 'priority_dialog'
  - Ingen särskild UI vid strategy = 'send_all'

### Exempel på konfliktdata
```json
{
  "conflicts": [
    {
      "musicianId": 123,
      "musicianName": "Anna Andersson",
      "positions": [
        {
          "needId": 45,
          "positionName": "Konsertmästare",
          "rank": 3
        },
        {
          "needId": 46,
          "positionName": "Tutti violin 1",
          "rank": 1
        }
      ]
    }
  ]
}
```

## Framtida förbättringar
1. **Smart prioritering**: Systemet kan föreslå prioritering baserat på:
   - Musikerns ranking i respektive lista
   - Positionens hierarkiska nivå
   - Antal tillgängliga musiker för varje position

2. **Historik**: Spara vilka val som gjorts för att kunna analysera mönster

3. **Musikerpreferenser**: Låt musiker ange preferenser i sin profil