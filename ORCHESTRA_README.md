# Orkestervikarieförfrågningssystem

Ett webbaserat system för professionella orkestrar att hantera vikarieförfrågningar med automatiserad kommunikation, rankningssystem och filhantering.

## 📋 Innehållsförteckning

- [Systemöversikt](#systemöversikt)
- [Teknisk Stack](#teknisk-stack)
- [Installation](#installation)
- [Databastabeller](#databastabeller)
- [Utvecklingsordning](#utvecklingsordning)
- [Användningsscenarier](#användningsscenarier)
- [Säkerhet](#säkerhet)

## 🎯 Systemöversikt

### Huvudfunktioner

1. **Musikerdatabas** - Hantera musiker med kontaktinfo, kvalifikationer och status
2. **Rankningssystem** - Drag & drop rankningslistor per tjänst och svårighetsgrad
3. **Projekthantering** - Skapa projekt med bemanningsbehov och filuppladdning
4. **Automatiska förfrågningar** - Tre strategier: Sekventiell, Parallell, Först till kvarn
5. **Filhantering** - Automatisk distribution av noter vid bekräftelse

## 🛠️ Teknisk Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Prisma
- **Drag & Drop**: @dnd-kit/sortable
- **E-post**: Resend
- **Validering**: Zod + React Hook Form

## 📦 Installation

### Förutsättningar

- Node.js 18+
- npm eller yarn
- Supabase-konto
- Resend-konto (för e-post)

### Steg

1. **Klona projektet**
```bash
git clone [repository-url]
cd orchestra-system
```

2. **Installera dependencies**
```bash
npm install
```

3. **Konfigurera miljövariabler**

Kopiera `.env.example` till `.env.local` och fyll i:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (for Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Kör databas-migrering**
```bash
npx prisma migrate dev
```

5. **Seed databas med grunddata**
```bash
npx prisma db seed
```

6. **Starta utvecklingsserver**
```bash
npm run dev
```

## 📊 Databastabeller

### Översikt av alla 15 tabeller

| Tabell | Beskrivning | ID-prefix |
|--------|-------------|-----------|
| musicians | Musikerinformation | MUS001, MUS002... |
| instruments | Instrumenttyper | INST001, INST002... |
| positions | Tjänster per instrument | POS001, POS002... |
| musician_qualifications | Kopplar musiker till tjänster | - |
| ranking_lists | Rankningslistor per tjänst | RANK001, RANK002... |
| rankings | Musikers position i listor | RNK001, RNK002... |
| projects | Projektinformation | PROJ001, PROJ002... |
| project_needs | Bemanningsbehov per projekt | NEED001, NEED002... |
| requests | Förfrågningar till musiker | REQ001, REQ002... |
| request_tokens | Tokens för svar-länkar | Token (CUID) |
| email_templates | E-postmallar | TMPL001, TMPL002... |
| communication_log | Kommunikationshistorik | COMM001, COMM002... |
| project_files | Projektfiler och noter | FILE001, FILE002... |
| audit_log | Ändringshistorik | AUDIT001, AUDIT002... |
| id_sequences | ID-sekvenser (aldrig återanvänd) | - |

### Detaljerad tabellstruktur

Se `prisma/schema.prisma` för fullständig databasstruktur.

## 🎻 Instrumenthierarki

```
Violin
├── Förste konsertmästare
├── Andre konsertmästare
├── Stämledare violin 2
├── Tutti violin 1
└── Tutti violin 2

Viola
├── Stämledare
├── Alternerande stämledare
└── Tutti

Cello
├── Solocellist
├── Alternerande stämledare
└── Tutti

Kontrabas
├── Stämledare
└── Tutti
```

## 🚀 Utvecklingsordning

### Fas 1: Grundsystem (3-4 dagar) ✅ (Delvis)
- [x] Setup Next.js med TypeScript och Tailwind
- [x] Konfigurera Supabase och Prisma
- [x] Skapa databasschema
- [x] Setup miljövariabler
- [x] Skapa seed-data
- [ ] Bygg CRUD för musiker
- [ ] Implementera kvalifikationshantering
- [ ] Lägg till status (aktiv/inaktiv/arkiverad)

### Fas 2: Rankningssystem (2-3 dagar)
- [ ] Skapa rankningslista-komponenter
- [ ] Implementera drag & drop
- [ ] Hantering av inaktiva musiker
- [ ] Spara rankningsändringar

### Fas 3: Projektsystem (2 dagar)
- [ ] CRUD för projekt
- [ ] Filuppladdning med Supabase Storage
- [ ] Bemanningsbehov-formulär
- [ ] Koppling till rankningslistor

### Fas 4: Förfrågningssystem (5-6 dagar)
- [ ] E-postmallar
- [ ] Token-baserad svarshantering
- [ ] Sekventiell förfrågningsstrategi
- [ ] Parallell & först till kvarn
- [ ] Timeout och påminnelser
- [ ] Automatisk notdistribution

### Fas 5: Dashboard & Polish (2 dagar)
- [ ] Admin dashboard
- [ ] Kommunikationshistorik
- [ ] Svarsstatistik
- [ ] Export-funktioner

## 📚 Användningsscenarier

### Scenario 1: Skapa ny musiker
1. Admin går till "Musiker" → "Ny musiker"
2. Fyller i kontaktinformation
3. Väljer instrument från dropdown
4. Kryssar i kvalifikationer
5. Sparar → Unikt ID (MUS003) genereras

### Scenario 2: Sekventiell förfrågan
1. Projekt behöver 1 konsertmästare
2. System skickar till rank #1
3. Vid NEJ/timeout → automatiskt till rank #2
4. Vid JA → tackmail med noter

### Scenario 3: Parallell förfrågan
1. Projekt behöver 2 violinister
2. Skickar samtidigt till rank #1 och #2
3. Om någon svarar NEJ → skicka till rank #3

### Scenario 4: Först till kvarn
1. Projekt behöver 3 musiker, max 6 mottagare
2. Skickar till 6 musiker samtidigt
3. Första 3 som svarar JA får jobbet
4. Övriga får "position fylld" mail

## 📧 E-postflöde

### Förfrågningsmail
- Projektinfo
- Period och tider
- JA/NEJ knappar med unika tokens

### Påminnelse (efter 12h)
- Kort påminnelse
- Samma svarsknappar

### Bekräftelse (vid JA)
- Tackmeddelande
- Bifogar relevanta noter automatiskt

### Position fylld
- Skickas till de som inte hann svara
- Vänlig information om att platsen fyllts

## 🔒 Säkerhet

### ID-hantering (KRITISKT)
- **ID:n återanvänds ALDRIG** - Även borttagna entiteter behåller sina ID
- Separat `id_sequences` tabell säkerställer detta
- Databastransaktion vid varje ID-generering

```typescript
// Säker ID-generering
const newMusicianId = await generateUniqueId('musician') // MUS001
// Om MUS001 tas bort, kommer nästa musiker få MUS002, inte MUS001
```

### Övriga säkerhetsåtgärder
- Token-baserade svarslänkar (engångsanvändning)
- Databastransaktioner för race conditions
- Input-validering med Zod
- Rate limiting för e-post
- Audit trail för alla ändringar

## 🔧 Utvecklingsmiljö

### Kommandon

```bash
# Utveckling
npm run dev

# Bygg för produktion
npm run build

# Kör Prisma Studio (databas-GUI)
npx prisma studio

# Generera Prisma Client
npx prisma generate

# Kör migrering
npx prisma migrate dev

# Seed databas
npx prisma db seed
```

### Projektstruktur

```
orchestra-system/
├── app/                    # Next.js app router
│   ├── admin/             # Admin-sidor
│   │   ├── musicians/     # Musikerhantering
│   │   ├── projects/      # Projekthantering
│   │   └── rankings/      # Rankningslistor
│   ├── api/               # API routes
│   └── page.tsx           # Startsida
├── components/            # React-komponenter
├── lib/                   # Hjälpfunktioner
│   ├── prisma.ts         # Prisma client
│   ├── supabase.ts       # Supabase client
│   ├── id-generator.ts   # Säker ID-generering
│   └── utils.ts          # Diverse hjälpfunktioner
├── prisma/               # Databas
│   ├── schema.prisma     # Databasschema
│   └── seed.ts          # Seed-data
└── types/               # TypeScript types
```

## 📈 Framtida förbättringar

- SMS-notifikationer som backup
- Mobilapp för musiker
- Integration med kalendersystem
- Avancerad statistik och rapporter
- Multi-tenant stöd för flera orkestrar

## 📝 Dokumentation

För mer detaljerad information, se:
- `PROJECT_DOCUMENTATION.md` - Komplett projektbeskrivning
- `TODO.md` - Detaljerad utvecklings-TODO
- `prisma/schema.prisma` - Fullständig databasstruktur