# Gruppmail-funktion Specifikation

## Översikt

Gruppmail-funktionen låter administratörer skicka e-post till musiker som accepterat förfrågningar för ett specifikt projekt. Funktionen stödjer flexibel filtrering baserat på instrument och tjänster.

## Användarfall

### Primära scenarion
1. **Generell information till alla**: "Repetitionen imorgon är framflyttad till kl 11:00"
2. **Instrument-specifik kommunikation**: "Hej violinister, imorgon är det tillagd stämrep kl 09:00"
3. **Tjänst-specifik kommunikation**: "Till alla Violin 2 Tutti - noterna har uppdaterats"
4. **Multi-instrument meddelanden**: "Till flöjt och basar - särskild genomgång kl 10:00"

## Teknisk implementation

### 1. Menyintegration
**Fil**: `/app/admin/layout.tsx`
```typescript
const navigation = [
  { name: 'Översikt', href: '/admin' },
  { name: 'Projekt', href: '/admin/projects' },
  { name: 'Musiker', href: '/admin/musicians' },
  { name: 'Instrument', href: '/admin/instruments' },
  { name: 'Rankningar', href: '/admin/rankings' },
  { name: 'Gruppmail', href: '/admin/group-email' }, // NY
]
```

### 2. Huvudkomponent
**Fil**: `/app/admin/group-email/page.tsx`

#### Layout struktur:
```
┌─────────────────────────────────────────┐
│ Gruppmail till accepterade musiker      │
├─────────────────────────────────────────┤
│ 1. Välj projekt                         │
│ [Dropdown med alla projekt]             │
├─────────────────────────────────────────┤
│ 2. Välj mottagare                       │
│ ○ Alla accepterade (15 musiker)         │
│ ○ Välj instrument/tjänster              │
│   □ Violin (5 musiker)                  │
│     □ Förste konsertmästare (1)         │
│     □ Tutti violin 1 (2)                │
│   □ Viola (3 musiker)                   │
│     □ Stämledare (1)                    │
│     □ Tutti (2)                         │
├─────────────────────────────────────────┤
│ 3. Valda mottagare (8 st)               │
│ • Anna Svensson (Violin 1)              │
│ • Erik Johansson (Violin 1)             │
│ • Maria Andersson (Violin 2)            │
│ [Visa alla...]                          │
├─────────────────────────────────────────┤
│ 4. Skriv meddelande                     │
│ Ämne: [___________________________]     │
│ Meddelande:                             │
│ [Text editor med formatering]           │
│                                         │
│ [Förhandsgranska] [Skicka]             │
└─────────────────────────────────────────┘
```

### 3. API Endpoints

#### GET `/api/group-email/recipients`
Hämtar accepterade musiker för ett projekt.

**Query parameters:**
- `projectId` (required)
- `instrumentIds[]` (optional)
- `positionIds[]` (optional)

**Response:**
```json
{
  "recipients": [
    {
      "id": 1,
      "name": "Anna Svensson",
      "email": "anna@example.com",
      "instrument": "Violin",
      "position": "Förste konsertmästare"
    }
  ],
  "groupedByInstrument": {
    "Violin": {
      "total": 5,
      "positions": {
        "Förste konsertmästare": ["Anna Svensson"],
        "Tutti violin 1": ["Erik Johansson", "Maria Andersson"]
      }
    }
  }
}
```

#### POST `/api/group-email/send`
Skickar mail till valda mottagare.

**Request body:**
```json
{
  "projectId": 1,
  "recipientIds": [1, 2, 3],
  "subject": "Repetitionsändring",
  "message": "Hej! Repetitionen är flyttad...",
  "sendCopy": true // Skicka kopia till admin
}
```

### 4. Komponenter

#### RecipientSelector
```typescript
interface RecipientSelectorProps {
  projectId: number
  onRecipientsChange: (recipients: Recipient[]) => void
}
```
- Hanterar laddning av musiker
- Grupperar per instrument/tjänst
- Uppdaterar val i realtid
- Visar antal per grupp

#### EmailComposer
```typescript
interface EmailComposerProps {
  recipients: Recipient[]
  onSend: (subject: string, message: string) => void
}
```
- Rich text editor eller markdown
- Förhandsgranskningsläge
- Validering av ämne/meddelande
- Skicka-knapp med bekräftelse

#### RecipientPreview
```typescript
interface RecipientPreviewProps {
  recipients: Recipient[]
  maxVisible?: number
}
```
- Visar valda mottagare
- Expanderbar lista om många
- Gruppering per instrument

### 5. Databas-queries

```sql
-- Hämta accepterade musiker för ett projekt
SELECT DISTINCT
  m.id,
  m.firstName,
  m.lastName,
  m.email,
  i.name as instrumentName,
  p.name as positionName
FROM Request r
JOIN Musician m ON r.musicianId = m.id
JOIN ProjectNeed pn ON r.projectNeedId = pn.id
JOIN Position p ON pn.positionId = p.id
JOIN Instrument i ON p.instrumentId = i.id
WHERE 
  pn.projectId = ? 
  AND r.status = 'accepted'
  AND m.isActive = true
ORDER BY i.displayOrder, p.hierarchyLevel
```

### 6. State Management

```typescript
const [selectedProject, setSelectedProject] = useState<number | null>(null)
const [selectionMode, setSelectionMode] = useState<'all' | 'custom'>('all')
const [selectedInstruments, setSelectedInstruments] = useState<number[]>([])
const [selectedPositions, setSelectedPositions] = useState<number[]>([])
const [recipients, setRecipients] = useState<Recipient[]>([])
const [subject, setSubject] = useState('')
const [message, setMessage] = useState('')
const [sending, setSending] = useState(false)
```

### 7. Säkerhet & Validering

1. **Rate limiting**: Max 100 mail per timme
2. **Mottagarbegränsning**: Max 200 mottagare per utskick
3. **Bekräftelse**: Dialog vid >50 mottagare
4. **Loggning**: Alla gruppmail sparas i CommunicationLog
5. **Validering**: 
   - Ämne: 1-200 tecken
   - Meddelande: 10-10000 tecken
   - Minst 1 mottagare

### 8. E-posthantering

```typescript
// Återanvänd befintlig sendEmail funktion
for (const recipient of recipients) {
  await sendEmail({
    to: recipient.email,
    subject: subject,
    html: formatMessage(message, recipient),
    from: 'Orchestra System <no-reply@stagesub.com>'
  })
  
  // Logga i CommunicationLog
  await prisma.communicationLog.create({
    data: {
      type: 'group_email',
      timestamp: new Date(),
      emailContent: JSON.stringify({
        subject,
        message,
        recipientCount: recipients.length,
        filters: { instrumentIds, positionIds }
      })
    }
  })
}
```

### 9. UI/UX Detaljer

#### Interaktionsflöde:
1. Välj projekt → Laddar musiker automatiskt
2. Standard: "Alla accepterade" valt
3. Växla till "Välj instrument/tjänster" → Visa checkboxar
4. Kryssa i instrument → Expandera för att visa tjänster
5. Mottagarlistan uppdateras dynamiskt
6. Skriv meddelande → Aktivera "Skicka"-knapp
7. Klicka "Förhandsgranska" → Visa hur mailet ser ut
8. Klicka "Skicka" → Bekräftelsedialog → Skicka

#### Visuella indikatorer:
- ✅ Grön badge för antal valda per grupp
- 📧 Mail-ikon vid varje mottagare
- ⏳ Laddningsindikator vid sändning
- ✓ Bekräftelse när mail skickats

### 10. Framtida förbättringar

1. **Mallar**: Spara och återanvänd vanliga meddelanden
2. **Schemaläggning**: Skicka mail vid specifik tid
3. **Bilagor**: Lägg till filer till gruppmail
4. **Personalisering**: Variabler som {firstName} i meddelandet
5. **SMS-integration**: För brådskande meddelanden
6. **Svarshantering**: Se vilka som öppnat/klickat
7. **Undantag**: Exkludera specifika musiker
8. **CC/BCC**: Kopia till andra administratörer

## Implementation checklist

- [ ] Lägg till menypost i layout.tsx
- [ ] Skapa `/app/admin/group-email/page.tsx`
- [ ] Implementera RecipientSelector komponent
- [ ] Implementera EmailComposer komponent
- [ ] Skapa API endpoint för recipients
- [ ] Skapa API endpoint för send
- [ ] Lägg till rate limiting
- [ ] Implementera loggning
- [ ] Skapa bekräftelsedialog
- [ ] Testa med olika projekttyper
- [ ] Responsiv design för mobil
- [ ] Dokumentera i användarmanual