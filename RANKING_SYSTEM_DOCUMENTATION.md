# Rankningssystem - Dokumentation

## Översikt

Rankningssystemet är en central del av orkestervikarieförfrågningssystemet. Det låter administratörer skapa och hantera prioriterade listor av musiker för varje tjänst/kvalifikation.

## Nyckelkoncept

### A/B/C-listor
- Varje tjänst (t.ex. "Förste konsertmästare") kan ha tre rankningslistor: A, B och C
- Listorna är inte hårt kopplade till svårighetsgrad utan kan användas flexibelt
- Varje lista kan ha en valfri beskrivning för att förtydliga dess syfte

### Musikerhantering
- **En musiker kan finnas i flera listor** - samma person kan vara rankad olika i A, B och C-listan
- **Inaktiva musiker**:
  - Behåller sin position i alla listor
  - Visas med "Inaktiv" badge
  - Kan fortfarande läggas till i listor
  - Hoppas över automatiskt vid förfrågningar

### Interaktiva funktioner
- **Drag & drop** - Ändra ordning genom att dra musiker upp/ner
- **Klickbara namn** - Klicka på musikernamn för att se deras profil
- **Ta bort** - X-knapp för att ta bort musiker från lista (med bekräftelse)

## Teknisk implementation

### Databas
```prisma
model RankingList {
  id              Int         @id @default(autoincrement())
  rankingListId   String      @unique @default(cuid())
  positionId      Int
  listType        String      // "A", "B", "C"
  description     String?     // Valfri beskrivning
  version         Int         @default(1)
  
  @@unique([positionId, listType])
}
```

### API Endpoints
- `GET /api/rankings/overview` - Hämtar alla instrument med positioner och listor
- `POST /api/rankings` - Skapar ny rankningslista
- `GET /api/rankings/[id]` - Hämtar specifik lista med musiker
- `PUT /api/rankings/[id]/reorder` - Sparar ny ordning efter drag & drop
- `GET /api/rankings/[id]/available-musicians` - Hämtar musiker som kan läggas till
- `POST /api/rankings/[id]/add-musician` - Lägger till musiker i lista
- `DELETE /api/rankings/[id]` - Tar bort musiker från lista

### UI-komponenter
- **RankingsPage** - Översikt med alla instrument och listor
- **RankingListPage** - Detaljvy för en specifik lista
- **SortableMusician** - Drag & drop-komponent för varje musiker

## Användarflöde

### Skapa ny lista
1. Navigera till Rankningar
2. Välj instrument i sidomenyn
3. Klicka "+ Skapa lista" under A, B eller C
4. Lägg till valfri beskrivning
5. Klicka "Skapa lista"

### Lägga till musiker
1. Öppna en rankningslista
2. Klicka "+ Lägg till musiker"
3. Se alla tillgängliga musiker (även inaktiva)
4. Klicka "Lägg till" för önskad musiker

### Ändra ordning
1. Håll in musen på drag-ikonen (tre streck)
2. Dra musikern upp eller ner
3. Släpp på önskad position
4. Ordningen sparas automatiskt

## Affärsregler

1. **Unika listor** - Endast en lista av varje typ (A/B/C) per position
2. **Ingen dubblering inom lista** - En musiker kan bara finnas en gång per lista
3. **Flera listor OK** - Samma musiker kan finnas i A, B och C med olika ranking
4. **Inaktiva inkluderade** - Inaktiva musiker visas men hoppas över vid förfrågningar
5. **Behåll position** - Musiker behåller sin ranking även när de blir inaktiva

## Framtida förbättringar

- Versionshantering för samtidiga ändringar
- Historik över rankningsändringar
- Bulk-import av musiker till lista
- Kopiera rankningslistor mellan positioner
- Exportera listor som Excel/PDF