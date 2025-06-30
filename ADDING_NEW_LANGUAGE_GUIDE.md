# Guide: Lägga till ett nytt språk i Orchestra System

## Översikt

Denna guide förklarar hur du lägger till ett nytt språk (t.ex. norska) till Orchestra System. Språkstödet påverkar både email-mallar och musikerprofiler.

## Steg 1: Uppdatera språkkonfigurationen

Öppna `/lib/email-template-utils.ts` och lägg till det nya språket:

```typescript
export const SUPPORTED_LANGUAGES = {
  sv: { label: 'Svenska', flag: '🇸🇪', code: 'sv' },
  en: { label: 'English', flag: '🇬🇧', code: 'en' },
  no: { label: 'Norsk', flag: '🇳🇴', code: 'no' }, // NYA SPRÅKET!
  // Lägg till fler språk här...
} as const
```

## Steg 2: Skapa email-mallar för det nya språket

### Alternativ A: Via Admin UI (Rekommenderat)

1. Gå till `/admin/templates`
2. För varje malltyp (Request, Reminder, Confirmation, Position Filled):
   - Klicka på malltypen för att expandera
   - Under norska (🇳🇴), klicka "Skapa mall"
   - Systemet skapar automatiskt rätt template type (`request_no`, etc.)

### Alternativ B: Via Seed-funktion

1. Uppdatera `/app/api/templates/seed/route.ts`:

```typescript
// Lägg till norska mallar i defaultTemplates array:
{
  type: 'request_no',
  subject: 'Forespørsel: {{project_name}} - {{position}}',
  body: `Hei {{musician_name}}!

Du har mottatt en forespørsel om å vikariere som {{position}} i produksjonen {{project_name}}.

Prosjektet starter {{start_date}} (uke {{week_number}}).

Vennligst svar ved å klikke på lenken nedenfor:
{{response_url}}

Med vennlig hilsen,
Orkesteradministrasjonen`,
  variables: ['musician_name', 'position', 'project_name', 'start_date', 'week_number', 'response_url']
}
```

2. Kör seed-funktionen via UI:
   - Gå till `/admin/templates`
   - Klicka "Skapa saknade mallar"

## Steg 3: Musikerprofil dropdown uppdateras automatiskt!

**Viktig information**: När du lägger till ett språk i `SUPPORTED_LANGUAGES` kommer det automatiskt att:
- Visas i dropdown när man redigerar en musikerprofil
- Vara tillgängligt för val i preferredLanguage
- Användas för att välja rätt email-mall

Du behöver INTE uppdatera någon UI-komponent manuellt!

## Steg 4: Lägg till default template content (Optional)

I `/lib/email-template-utils.ts`, uppdatera `generateDefaultTemplateContent()` funktionen:

```typescript
const templates = {
  request: {
    sv: { /* svenska */ },
    en: { /* engelska */ },
    no: { // LÄGG TILL NORSKA
      subject: 'Forespørsel: {{projectName}} - {{positionName}}',
      body: `Hei {{firstName}}, ...`
    }
  },
  // ... andra malltyper
}
```

## Hur "Skapa saknade mallar" fungerar

Funktionen "Skapa saknade mallar" (`/api/templates/seed`):

1. **Kontrollerar vilka mallar som finns**
   - Hämtar alla befintliga mallar från databasen
   - Jämför med alla möjliga kombinationer (bastyp + språk)

2. **Identifierar saknade mallar**
   - Om `request_no` inte finns, märks den som saknad
   - Om `confirmation_en` inte finns, märks den som saknad

3. **Skapar endast de som saknas**
   - Genererar unika ID:n
   - Använder default-innehåll från seed-filen
   - Hoppar över mallar som redan finns

**Exempel**: Om du har:
- ✅ request (svenska)
- ✅ request_en
- ❌ request_no (saknas)

Kommer funktionen endast skapa `request_no`.

## Sammanfattning av språktillägg

1. **En rad kod** i `SUPPORTED_LANGUAGES` = språket finns överallt
2. **Email-mallar** skapas via UI eller seed
3. **Musikerprofiler** får automatiskt det nya språket
4. **Språkval** används automatiskt vid email-utskick

## Tips

- Använd ISO 639-1 språkkoder (sv, en, no, da, fi)
- Håll språklabels korta och tydliga
- Använd landsflaggor som emojis för visuell igenkänning
- Testa alltid alla mallar efter tillägg av nytt språk

## Vanliga frågor

**F: Måste jag skapa alla 4 malltyper för ett nytt språk?**
S: Nej, systemet faller tillbaka på svenska om en specifik mall saknas.

**F: Kan jag ha olika språk för olika malltyper?**
S: Ja, en musiker kan t.ex. få request på engelska men confirmation på svenska om bara den finns.

**F: Hur många språk kan systemet hantera?**
S: Obegränsat! Lägg till så många du vill i `SUPPORTED_LANGUAGES`.