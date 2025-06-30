# Tenant Template System - Detaljerad Plan

## Översikt

När Orchestra System blir en multi-tenant SaaS-lösning behöver varje ny kund (tenant) få en standarduppsättning av data. Detta dokument beskriver hur tenant templates ska fungera.

## Vad är en Tenant Template?

En tenant template är en fördefinierad uppsättning av:
- **Instrument** med sina positioner
- **Email-mallar** på olika språk
- **Systeminställningar** och begränsningar
- **Standarddata** för att komma igång snabbt

## Template-struktur per Tier

### 🎵 Small Ensemble Template ($79/månad)

**Instrument (grundläggande):**
- Violin (5 positioner)
- Viola (3 positioner)
- Cello (3 positioner)
- Kontrabas (2 positioner)
- Flöjt (3 positioner)
- Klarinett (4 positioner)
- Trumpet (4 positioner)

**Email-mallar:**
- Endast svenska (4 mallar)
- Request, Reminder, Confirmation, Position Filled

**Begränsningar:**
- Max 50 musiker
- Max 5 aktiva projekt
- Max 10 instrument

### 🎼 Medium Ensemble Template ($499/månad)

**Instrument (full orkester):**
- Alla stråkinstrument
- Alla träblåsinstrument
- Alla brassinstrument
- Slagverk och harpa
- Totalt ~20 instrument

**Email-mallar:**
- Svenska + Engelska (8 mallar)
- Alla 4 typer på båda språken

**Begränsningar:**
- Max 200 musiker
- Max 20 aktiva projekt
- Obegränsat med instrument

### 🏛️ Institution Template ($1,500/månad)

**Instrument (utökad):**
- Full symfoniorkester
- Specialinstrument (saxofon, etc.)
- Anpassningsbara positioner

**Email-mallar:**
- Svenska, Engelska + förberedda för fler språk
- Möjlighet att lägga till egna språk

**Begränsningar:**
- Obegränsat allt
- API-access
- Custom branding

## Implementation i Databasen

```prisma
model TenantTemplate {
  id              Int      @id @default(autoincrement())
  templateId      String   @unique @default(cuid())
  name            String   @unique
  tier            String   // "small_ensemble", "medium_ensemble", "institution"
  description     String?
  isActive        Boolean  @default(true)
  
  // JSON-fält för template-innehåll
  instruments     Json     // Array av instrument med positioner
  emailTemplates  Json     // Array av email-mallar
  settings        Json     // Tier-specifika inställningar
  limits          Json     // Begränsningar (musiker, projekt, etc.)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Tenant {
  id              Int      @id @default(autoincrement())
  tenantId        String   @unique @default(cuid())
  name            String
  subdomain       String   @unique
  tier            String
  templateUsed    String?  // Vilken template som användes
  
  // ... andra fält
}
```

## Onboarding-process

1. **Ny kund registrerar sig**
   - Väljer prenumerationsplan
   - Anger orkesternamn och subdomain

2. **System skapar tenant**
   - Ny rad i Tenant-tabellen
   - Genererar unik tenantId

3. **Template appliceras automatiskt**
   - Hämtar rätt template baserat på tier
   - Kopierar alla instrument till tenantens data
   - Kopierar email-mallar
   - Sätter limits och inställningar

4. **Kund kan börja direkt**
   - Alla grunddata finns på plats
   - Kan börja lägga till musiker
   - Kan anpassa efter behov

## Superadmin-funktioner

### Template Management UI
- `/superadmin/templates` - Lista alla templates
- `/superadmin/templates/[id]/edit` - Redigera template
- Möjlighet att:
  - Uppdatera instrument och positioner
  - Lägga till/ta bort email-mallar
  - Justera limits per tier
  - Aktivera/inaktivera templates

### Tenant Management
- Se vilken template som användes för varje tenant
- Möjlighet att "re-apply" template
- Override limits för specifika tenants

## Framtida Utökningar

1. **Custom Templates**
   - Skapa specialanpassade templates för stora kunder
   - A/B-testa olika template-varianter

2. **Template Versioning**
   - Spara historik av template-ändringar
   - Möjlighet att "uppgradera" existerande tenants

3. **Template Marketplace**
   - Låt kunder dela templates
   - Community-skapade instrument-uppsättningar

## Teknisk Implementation

### Steg 1: Skapa Template Storage (Vecka 1)
```typescript
// /lib/tenant-templates/
export const DEFAULT_TEMPLATES = {
  small_ensemble: {
    name: "Small Ensemble",
    instruments: [...],
    emailTemplates: [...],
    limits: {
      maxMusicians: 50,
      maxProjects: 5,
      maxInstruments: 10
    }
  },
  // ... andra templates
}
```

### Steg 2: Template API (Vecka 2)
```typescript
// /app/api/superadmin/templates/route.ts
- GET: Lista templates
- POST: Skapa ny template
- PUT: Uppdatera template
- DELETE: Ta bort template
```

### Steg 3: Apply Template Function (Vecka 3)
```typescript
async function applyTemplateToTenant(tenantId: string, templateId: string) {
  const template = await getTemplate(templateId)
  
  // Skapa instrument
  for (const instrument of template.instruments) {
    await createInstrumentForTenant(tenantId, instrument)
  }
  
  // Skapa email-mallar
  for (const emailTemplate of template.emailTemplates) {
    await createEmailTemplateForTenant(tenantId, emailTemplate)
  }
  
  // Sätt limits
  await setTenantLimits(tenantId, template.limits)
}
```

## Fördelar

1. **Snabb onboarding** - Nya kunder kan börja direkt
2. **Konsekvent upplevelse** - Alla får samma kvalitetsstart
3. **Lätt att underhålla** - Uppdatera template = alla nya kunder får det
4. **Tier-differentiering** - Tydlig skillnad mellan prisnivåer
5. **Skalbart** - Lätt att lägga till nya tiers eller språk

Detta system säkerställer att varje ny kund får en professionell start med Orchestra System!