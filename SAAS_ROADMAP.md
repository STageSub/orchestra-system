# 🚀 StageSub SaaS Roadmap

## Vision

StageSub ska utvecklas till en komplett SaaS-lösning (Software as a Service) där flera orkestrar kan använda samma plattform med separata, säkra datamiljöer. Systemet kommer erbjudas som en prenumerationstjänst med olika prisnivåer anpassade efter orkestrarnas storlek och behov.

## Arkitektur

### Multi-tenant strategi

**Vald approach: Delad databas med Tenant ID** (Row-level security)
- Alla orkestrar delar samma databas
- Varje tabell får en `tenantId` kolumn
- Automatisk filtrering baserat på inloggad orkester
- Fördelar: Enkel att underhålla, kostnadseffektiv, enkel backup

**Alternativ för framtiden: Hybrid approach**
- Enterprise-kunder kan få egen databas
- Subdomain routing: `goteborg.stagesub.se`

### Säkerhetsmodell

```
Superadmin (StageSub)
├── Full systemåtkomst
├── Kan se alla tenants
├── Hantera prenumerationer
└── Systemkonfiguration

Orkesteradmin
├── Full åtkomst till sin orkester
├── Användarhantering
├── Inställningar (med lösenord)
└── Se användningsstatistik

Orkesteranvändare
├── Hantera musiker & projekt
├── Skicka förfrågningar
└── Se rapporter

Musiker (extern)
├── Svara på förfrågningar via token
└── Uppdatera sin profil
```

## Prismodell

### 🎵 Solo (Gratis)
- Max 25 musiker
- Max 2 aktiva projekt
- Max 5 instrument
- Grundläggande support
- StageSub branding

### 🎼 Ensemble (499 kr/månad)
- Max 100 musiker
- Max 10 aktiva projekt
- Obegränsat med instrument
- E-postsupport
- Egen subdomain

### 🎭 Professional (999 kr/månad)
- Max 500 musiker
- Max 50 aktiva projekt
- Alla funktioner
- Prioriterad support
- Anpassad branding
- API-åtkomst

### 🏛️ Enterprise (Offert)
- Obegränsad användning
- Egen databas (option)
- SLA-avtal
- Dedikerad support
- Anpassningar
- On-premise option

## Teknisk implementation

### Fas 7.1: Autentisering & säkerhet
- [ ] Implementera NextAuth.js
- [ ] Skapa login/signup flöde
- [ ] Tenant-baserad data isolation
- [ ] Lösenordsskyddade admin-inställningar
- [ ] 2FA för administratörer

### Fas 7.2: Multi-tenant databas
- [ ] Lägg till tenantId i alla tabeller
- [ ] Implementera Prisma middleware för automatisk filtrering
- [ ] Tenant-specifik ID-generering (T1-MUS001)
- [ ] Datamigrering för befintlig data

### Fas 7.3: Prenumerationshantering
- [ ] Integration med Stripe
- [ ] Prenumerationsplaner
- [ ] Usage tracking (antal musiker, projekt)
- [ ] Automatiska begränsningar
- [ ] Faktureringssystem

### Fas 7.4: Landningssida
- [ ] Marketing site (Next.js)
- [ ] Priskalkylatorer
- [ ] Feature jämförelse
- [ ] Kundcase studies
- [ ] Demo-bokning
- [ ] Knowledge base

### Fas 7.5: Administration
- [ ] Superadmin dashboard
- [ ] Tenant management
- [ ] Usage analytics
- [ ] System health monitoring
- [ ] Backup/restore per tenant

## Begränsningar & kvothantering

```typescript
interface TenantLimits {
  maxMusicians: number
  maxActiveProjects: number
  maxInstruments: number
  maxMonthlyRequests: number
  maxFileStorageMB: number
  customBranding: boolean
  apiAccess: boolean
  prioritySupport: boolean
}
```

### Implementering av begränsningar
1. Mjuka gränser: Varning vid 80%, 90%
2. Hårda gränser: Blockera vid 100%
3. Grace period: 7 dagar över gräns
4. Uppgraderingsförslag i UI

## Migrering från single-tenant

1. **Backup** av befintlig data
2. **Schema-uppdatering** med tenantId
3. **Data-migrering** till tenant 1
4. **Test** av all funktionalitet
5. **Gradvis utrullning**

## Infrastruktur

### Hosting
- **Primär**: Vercel (Next.js)
- **Databas**: Supabase PostgreSQL
- **Filer**: Cloudflare R2 / AWS S3
- **E-post**: Resend
- **Betalning**: Stripe

### Skalning
- Horizontal skalning av Next.js
- Database connection pooling
- CDN för statiska tillgångar
- Rate limiting per tenant

## Säkerhet

- **Data isolation**: Row-level security
- **Kryptering**: TLS + at-rest encryption
- **GDPR**: Data export/deletion per tenant
- **Audit logs**: Alla administrativa åtgärder
- **Backup**: Daglig, 30 dagars retention

## Marknadsföring & försäljning

### Målgrupper
1. **Små ensembler** (5-20 musiker)
2. **Regionala orkestrar** (20-100 musiker)
3. **Nationalorkestrar** (100+ musiker)
4. **Musikskolor & konservatorier**

### Go-to-market
1. Gratis pilot med 5 orkestrar
2. Case studies & testimonials
3. SEO-optimerad landningssida
4. Google Ads & Facebook
5. Branschmässor & konferenser

## Tidslinje

**Q1 2025**: Slutför grundsystem (Fas 1-6)
**Q2 2025**: Påbörja SaaS-transformation
**Q3 2025**: Beta med utvalda orkestrar
**Q4 2025**: Officiell SaaS-lansering

## Success metrics

- **MRR** (Monthly Recurring Revenue)
- **Churn rate** < 5%
- **CAC** (Customer Acquisition Cost) < 3 månaders intäkt
- **NPS** > 50
- **Uptime** > 99.9%

## Risker & mitigering

| Risk | Sannolikhet | Impact | Mitigering |
|------|------------|--------|------------|
| Data läckage mellan tenants | Låg | Hög | Rigorös testing, code reviews |
| Skalningsproblem | Medium | Medium | Load testing, caching |
| Konkurrens | Hög | Medium | Fokus på UX & branschkunskap |
| GDPR-compliance | Medium | Hög | Juridisk rådgivning, tydlig DPA |

## Nästa steg

1. ✅ Dokumentera SaaS-vision (denna fil)
2. ⏳ Slutföra fas 1-6 (grundsystem)
3. 🔜 Påbörja teknisk PoC för multi-tenant
4. 🔜 Undersöka juridiska krav (GDPR, DPA)
5. 🔜 Skapa business plan & finansiering