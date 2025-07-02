# Separat Databas Arkitektur - Orchestra System

## Översikt

Efter att ha stött på kritiska dataläckage-problem med multi-tenant arkitekturen har vi övergått till en enklare och säkrare arkitektur med separata databaser per kund (orkester).

## Arkitektur

### Tidigare: Multi-tenant (Komplex)
```
┌─────────────────────────────────────┐
│         Shared Database             │
├─────────────────────────────────────┤
│ Tenant A │ Tenant B │ Tenant C     │
│ (Filter) │ (Filter) │ (Filter)     │
└─────────────────────────────────────┘
           ↓ Risk för dataläckage
```

### Nu: Separat Databas (Enkel & Säker)
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Göteborg │  │  Malmö   │  │Stockholm │
│    DB    │  │    DB    │  │    DB    │
└──────────┘  └──────────┘  └──────────┘
    ↓              ↓              ↓
  100% isolerad data per orkester
```

## Implementation

### 1. Databas-konfiguration (`/lib/database-config.ts`)
```typescript
const DATABASE_URLS: Record<string, string> = {
  'goteborg': process.env.DATABASE_URL_GOTEBORG,
  'malmo': process.env.DATABASE_URL_MALMO,
  'stockholm': process.env.DATABASE_URL_STOCKHOLM,
  'admin': process.env.DATABASE_URL,
}
```

### 2. Subdomain Routing
- `goteborg.stagesub.com` → Göteborg databas
- `malmo.stagesub.com` → Malmö databas
- `stockholm.stagesub.com` → Stockholm databas

### 3. Middleware (`/middleware.ts`)
```typescript
const subdomain = getSubdomain(hostname)
response.headers.set('x-subdomain', subdomain)
```

## Fördelar

### 1. **Säkerhet**
- ✅ 100% dataisolering - ingen risk för läckage
- ✅ Ingen komplex tenant-filtrering
- ✅ Enklare säkerhetsmodell

### 2. **Prestanda**
- ✅ Ingen overhead från tenant-filtrering
- ✅ Kan optimera varje databas individuellt
- ✅ Lättare att skala horisontellt

### 3. **Enkelhet**
- ✅ Ingen AsyncLocalStorage eller tenant context
- ✅ Standard Prisma-användning utan middleware
- ✅ Lättare att felsöka och underhålla

### 4. **Flexibilitet**
- ✅ Olika databas-versioner per kund möjligt
- ✅ Kan migrera kunder individuellt
- ✅ Backup/restore per kund

## Nackdelar

### 1. **Administration**
- ❌ Fler databaser att hantera
- ❌ Separata migrations per databas
- ❌ Mer komplex deployment

### 2. **Kostnad**
- ❌ Potentiellt högre databaskostnader
- ❌ Mer resurser för små kunder

### 3. **Funktionalitet**
- ❌ Svårare att implementera cross-tenant features
- ❌ Superadmin måste koppla till flera databaser

## Migrationsväg

### Från Multi-tenant till Separat Databas
1. Backup av all data
2. Skapa separata databaser per tenant
3. Migrera data per tenant
4. Uppdatera connection strings
5. Ta bort tenant-kolumner från schema

### Återgång om nödvändigt
- Multi-tenant koden finns i branch: `backup-multi-tenant-2025-07-02`
- Kan återimplementera om behov uppstår

## Framtida Möjligheter

### 1. Hybrid Approach
- Små kunder: Shared database (multi-tenant)
- Stora kunder: Dedikerad databas
- Dynamisk routing baserat på kundtyp

### 2. Database-as-a-Service
- Automatisk provisionering av nya databaser
- Self-service för nya orkestrar
- Automatiska backups och underhåll

### 3. Edge Deployment
- Databaser nära användarnas geografiska plats
- Lägre latens för internationella kunder

## Tekniska Detaljer

### Miljövariabler (.env.local)
```bash
# Huvuddatabas
DATABASE_URL=postgresql://...

# Kunddatabaser
DATABASE_URL_GOTEBORG=postgresql://...
DATABASE_URL_MALMO=postgresql://...
DATABASE_URL_STOCKHOLM=postgresql://...
DATABASE_URL_UPPSALA=postgresql://... # Ny test
```

### Prisma Setup
- En Prisma-instans per databas
- Cachade connections för prestanda
- Samma schema för alla databaser

### API Routes
- Använder subdomain från request headers
- Väljer rätt Prisma-klient baserat på subdomain
- Ingen tenant-kontext behövs

## Nästa Steg

1. **Implementera orkester-skapande från superadmin**
   - UI för att skapa ny orkester
   - Automatisk databas-provisionering
   - Initial data seeding

2. **Förbättra superadmin dashboard**
   - Aggregerad statistik från alla databaser
   - Centraliserad hantering
   - Performance monitoring per databas

3. **Automatisera deployment**
   - CI/CD för multi-databas setup
   - Automatiska migrations
   - Health checks per databas

## Slutsats

Separat databas-arkitekturen ger oss en solid grund för Orchestra System med:
- Total datasäkerhet
- Enkel implementation
- Skalbarhet för framtiden

Även om vi förlorat vissa multi-tenant features, är fördelarna med säkerhet och enkelhet värda det för detta use case.