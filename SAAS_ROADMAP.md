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

## Prismodell (UPPDATERAD 2025-07-01) - NY 4-TIER STRUKTUR

### 🆓 Micro (Free)
- Max 5 musiker
- Max 1 aktiv projekt
- Grundläggande funktioner
- Community support
- Perfekt för små ensembler och komposer

### 🎵 Small ($299/månad)
- Max 50 musiker
- Max 5 aktiva projekt
- Max 10 instrument
- E-postautomation
- Grundläggande support
- Egen subdomain
- 30 dagars gratis trial

### 🎫 Project Pass ($99/projekt)
- Full access för enskilda projekt
- Obegränsade musiker för projektet
- Alla funktioner inkluderade
- Perfekt för engångsprojekt
- Support under projektets längd

### 🏛️ Institution ($999/månad)
- Obegränsad användning
- Obegränsade projekt och musiker
- Alla premiumfunktioner
- Prioriterad support
- API-åtkomst
- Anpassad branding
- Dedikerad account manager

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

## Tidslinje (UPPDATERAD 2025-06-28)

**Juni 2025**: ✅ Grundsystem 98% färdigt
**Juli 2025**: Påbörja SaaS-transformation (6 veckor)
- Vecka 1: Databas & Autentisering
- Vecka 2: Superadmin Dashboard
- Vecka 3: Self-Service Signup
- Vecka 4: Orchestra Admin Features
- Vecka 5: Migration System
- Vecka 6: Billing & Payments

**Augusti 2025**: Beta med 1-2 utvalda orkestrar
**September 2025**: Officiell SaaS-lansering
**Q4 2025**: 10+ betalande kunder

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

## Nästa steg (UPPDATERAD 2025-07-01)

1. ✅ Dokumentera SaaS-vision (denna fil)
2. ✅ Slutföra fas 1-6 (grundsystem) - 98% klart!
3. ✅ Besluta prenumerationsmodell - NY 4-TIER: Micro (Free), Small ($299), Project Pass ($99), Institution ($999)
4. ✅ Planera multi-tenant arkitektur - Shared DB → Dedicated DB migration
5. ✅ Implementera Week 1-2: Databas, Auth, Superadmin Dashboard
6. ✅ **Week 3**: Self-Service Signup & Moderniserad landningssida
7. 🚀 **NÄSTA**: Slutföra Week 3 (Onboarding wizard, Trial management)
8. 🔜 Week 4: Orchestra Admin Features & Billing integration
9. 🔜 Juridisk granskning (GDPR, DPA, användaravtal)
10. 🔜 Sätta upp Stripe-konto för betalningar