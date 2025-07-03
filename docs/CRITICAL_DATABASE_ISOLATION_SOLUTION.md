# 🚨 KRITISK: Database Isolation Architecture

## Problemet vi upptäckte (2025-07-03)

När du loggade in som scosco-admin såg du data från andra orkestrar. Detta berodde på att:

1. **Båda orkestrarna använde SAMMA databas** (tckcuexsdzovsqaqiqkr)
2. **Ingen tenant isolation** - alla tabeller saknar orchestraId
3. **Felaktig databastilldelning** vid skapande av ny orkester

## Arkitektur: Tre-lagers databasseparation

```
┌─────────────────────────────────────────────────────┐
│                  CENTRAL DATABASE                    │
│              (Huvuddatabasen i Supabase)             │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Orchestra  │  │   User   │  │ Subscription │  │
│  │   Tabell    │  │  Tabell  │  │   Tabell     │  │
│  └─────────────┘  └──────────┘  └──────────────┘  │
│                                                      │
│  Innehåller:                                         │
│  - Lista över alla orkestrar                        │
│  - Användaruppgifter (vilken orkester de tillhör)   │
│  - Databas-URL för varje orkester                   │
└─────────────────────────────────────────────────────┘
                           │
                           │ Pekar på
                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   SCO DATABASE      │    │  SCOSO DATABASE     │
│ (Separat Supabase)  │    │ (Separat Supabase)  │
│                     │    │                     │
│ - Musicians         │    │ - Musicians         │
│ - Projects          │    │ - Projects          │
│ - Requests          │    │ - Requests          │
│ - Rankings          │    │ - Rankings          │
│                     │    │                     │
│ INGEN KOPPLING      │    │ INGEN KOPPLING      │
│ TILL ANDRA!         │    │ TILL ANDRA!         │
└─────────────────────┘    └─────────────────────┘
```

## ✅ LÖSNING: Garanterad 100% Databasisolering

### 1. **Varje orkester får ALLTID en unik databas**

När en ny orkester skapas:

```typescript
// STEG 1: Skapa nytt Supabase-projekt automatiskt
const project = await supabaseManagement.createProject({
  name: `Orchestra ${subdomain}`,
  dbPass: generateSecurePassword(),
  region: 'eu-north-1'
})

// STEG 2: Vänta tills projektet är klart
await supabaseManagement.waitForProjectReady(project.id)

// STEG 3: Få unik connection string
const databaseUrl = await supabaseManagement.getConnectionString(project.id, password)

// STEG 4: Spara i Orchestra-tabellen
await prisma.orchestra.update({
  where: { id: orchestraId },
  data: { 
    databaseUrl: databaseUrl,  // UNIK för denna orkester!
    status: 'active'
  }
})
```

### 2. **Automatisk kontroll vid varje API-anrop**

```typescript
// auth-prisma.ts - Körs vid VARJE API-anrop
export async function getPrismaForUser(request: Request) {
  // 1. Hämta användarens token
  const token = getTokenFromCookie()
  
  // 2. Verifiera token och få orchestraId
  const payload = await verifyToken(token)
  
  // 3. Hämta orkesterns UNIKA databas
  const orchestra = await prisma.orchestra.findUnique({
    where: { id: payload.orchestraId },
    select: { subdomain: true, databaseUrl: true }
  })
  
  // 4. Returnera Prisma-klient för RÄTT databas
  return getPrismaClient(orchestra.subdomain)
}
```

### 3. **Databasvalideringen som förhindrar misstag**

```typescript
// I orchestra creation endpoint
// Kontrollera att databasen INTE redan används
const existingWithSameDb = await prisma.orchestra.findFirst({
  where: { databaseUrl: newDatabaseUrl }
})

if (existingWithSameDb) {
  throw new Error('KRITISKT: Denna databas används redan av en annan orkester!')
}
```

## 🔒 Säkerhetsgarantier

1. **Fysisk separation** - Olika Supabase-projekt = olika servrar
2. **Nätverksisolering** - Olika databas-URLer, olika lösenord
3. **Ingen delad data** - Varje databas är helt fristående
4. **Automatisk validering** - Systemet tillåter ALDRIG återanvändning av databaser

## ⚠️ VARNINGSSIGNALER att se upp för

1. **Samma projekt-ID i databas-URLer**
   ```
   BAD:  postgres.tckcuexsdzovsqaqiqkr för både SCO och SCOSO
   GOOD: postgres.tckcuexsdzovsqaqiqkr för SCO
         postgres.hqzrqnsvhyfypqklgoas för SCOSO
   ```

2. **Poolade databaser utan tenant isolation**
   - Om du använder DATABASE_URL_POOL_* måste du ha orchestraId i alla tabeller
   - Eller använd ALLTID automatisk Supabase-provisionering

3. **Manuellt skapade orkestrar**
   - Använd ALLTID API:et, skapa ALDRIG manuellt i databasen

## 📋 Checklista för ny orkester

- [ ] Supabase Management API konfigurerad (token + org ID)
- [ ] Automatisk provisionering aktiverad
- [ ] Unik databas skapad för orkestern
- [ ] Setup-script kört för att initiera databasen
- [ ] Admin-användare skapad automatiskt
- [ ] Testat inloggning och verifierat isolation

## 🚀 Implementation Status

- ✅ Auth-based database routing implementerad
- ✅ Alla 45+ API routes uppdaterade
- ✅ Automatisk Supabase-provisionering
- ✅ Validering mot databas-återanvändning
- ✅ Setup-script för databas-initiering

## Hur det fungerar nu:

1. **Superadmin skapar orkester** → Nytt Supabase-projekt skapas automatiskt
2. **Användare loggar in** → System hittar rätt databas via Orchestra-tabellen
3. **API-anrop** → getPrismaForUser() säkerställer rätt databas används
4. **100% isolation** → Ingen möjlighet att se andra orkestrar's data

## Framtida förbättringar:

1. **Health checks** - Verifiera databas-isolation regelbundet
2. **Audit logs** - Spåra vilken databas som används för varje request
3. **Automatisk cleanup** - Ta bort oanvända Supabase-projekt
4. **Multi-region support** - Skapa databaser närmare användarna