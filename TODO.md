# 📋 TODO - Orchestra System

## 🔴 KRITISKA BUGGAR ATT FIXA FÖRE SaaS (Uppdaterad 2025-06-29)

### ✅ Kritiska problem som NU ÄR LÖSTA
- [x] **E-posthistorik fungerar inte** - SQL migration skapad: `/prisma/migrations/manual_add_group_email_log.sql`
- [x] **Lokalt boende-filter** - Fullt implementerat med databas, UI och filtrering
- [x] **Konfliktvarningar och strategier** - Tre strategier implementerade (Enkel, Detaljerad, Smart)
- [x] **Toast-notifikationer** - Korrekt implementerat med rätt mönster (alert för admin, toast för externa händelser)

### ✅ Viktiga användbarhetsproblem som NU ÄR LÖSTA
- [x] **Moment 22 med strategi/antal** - REDAN LÖST! Smart implementation utan default-val finns redan
- [x] **Instrument laddas utan feedback** - Loading state implementerat med "Laddar instrument..."
- [x] **Arkivera musiker redirect** - Stannar nu på profilen och refreshar data
- [x] **Archive/restore för instrument** - Fullt implementerat med UI och API

### 🔴 Nya kritiska buggar att fixa (2025-06-30)
- [ ] **Synkronisera Preview/Sändningslogik** - Preview visar fel resultat jämfört med faktisk sändning
  - [ ] FCFS preview visar bara en mottagare när maxRecipients är tomt
  - [ ] Preview respekterar inte lokalt boende-filter
  - [ ] Preview hanterar inte konflikter korrekt
  - [ ] Extrahera gemensam logik för preview och sändning

### Mindre problem (förbättringar)
- [x] **Uppdateringstext i projekt** - Ta bort "Uppdateras automatiskt" och sekundräkning ✅ (2025-06-29)
- [ ] **Visningsordning i instrumentredigering** - Ta bort fältet från UI
- [ ] **Ta bort-knapp placering** - Flytta delete-ikon från lista till redigeringsvyn
- [x] **Accepterade musiker modal bugg** - Fixad case sensitivity och förbättrad design ✅ (2025-06-30)
- [x] **Modern tech design för projektdetaljer** - Implementerat breadcrumbs, smooth transitions, eleganta progress bars ✅ (2025-06-30)

### Nya förbättringar ✅ IMPLEMENTERADE (2025-06-30)
- [x] **Gröna bockar i bekräftelsemodaler** - Success modal med grön checkmark animation
- [x] **Flexibla svarstider** - Response time selector med timmar/dagar/veckor/månader
- [x] **Radera-ikon för ej startade projekt** - Delete-knapp på hover för projekt utan förfrågningar
- [x] **Multi-select för behov** - Välj flera positioner samtidigt vid skapande av behov
- [x] **Språkval för e-postmallar** - Svenska/engelska mallar baserat på musikers språkval ✅
- [x] **Rankningshierarki i musikerkort** - Fixad sortering (instrument först, sedan lista)
- [x] **Real-time log viewer** - Admin-verktyg för felsökning på `/admin/logs` ✅

### Realtidslösning (framtida)
- [ ] **Server-Sent Events (SSE)** för realtidsnotifikationer
- [ ] **Optimerad polling** kombinerat med SSE
- [ ] **Toast-notifikationer** för alla händelser

Se `/BUGFIX_CHECKLIST.md` för detaljerad information om varje bugg.

## 🚀 Current Phase: Transforming to Multi-Tenant SaaS

### Overview
6-week implementation plan to transform StageSub from single-orchestra to multi-tenant SaaS platform with three subscription tiers ($79/$499/$1500).

**✅ ALLA KRITISKA OCH VIKTIGA BUGGAR ÄR NU FIXADE! Systemet är redo för SaaS-transformation.**

## 📅 Week 1: Database & Authentication

### Database Schema Updates
- [ ] Create migration for Tenant table
- [ ] Create migration for User table (replace single password)
- [ ] Add tenantId to ALL existing tables
- [ ] Create indexes for tenant filtering performance
- [ ] Create audit log table for tracking changes

### Prisma Schema
- [ ] Update schema.prisma with Tenant and User models
- [ ] Add tenantId relation to all models
- [ ] Generate new Prisma client
- [ ] Test migrations on development database

### Authentication System
- [ ] Install and configure NextAuth.js
- [ ] Create login page at `/login`
- [ ] Implement JWT token generation with tenant context
- [ ] Create middleware for tenant validation
- [ ] Replace current auth system with user-based auth
- [ ] Add logout functionality
- [ ] Implement "remember me" functionality

### Connection Management
- [ ] Create DatabaseConnectionManager class
- [ ] Implement connection pooling for shared DB
- [ ] Add support for dedicated DB connections
- [ ] Create Prisma middleware for automatic tenant filtering
- [ ] Test connection switching

### ID Generation Updates
- [ ] Update generateUniqueId to include tenant prefix
- [ ] Format: TEN-MUS-001 (tenant-type-number)
- [ ] Update all existing ID references

## 📅 Week 2: Superadmin Dashboard

### Superadmin Routes
- [ ] Create `/superadmin` layout and navigation
- [ ] Implement superadmin authentication check
- [ ] Create dashboard overview page
- [ ] Add analytics widgets (tenants, revenue, usage)

### Tenant Management
- [ ] Create `/superadmin/tenants` page
- [ ] Tenant list with search/filter
- [ ] Create new tenant form
- [ ] Edit tenant details
- [ ] View tenant usage statistics
- [ ] Activate/deactivate tenants
- [ ] Set subscription limits

### User Management
- [ ] Create `/superadmin/users` page
- [ ] List all users across tenants
- [ ] Create users manually
- [ ] Reset user passwords
- [ ] Change user roles
- [ ] Impersonate users (for support)

### Migration Tools
- [ ] Create `/superadmin/migrations` page
- [ ] List migration requests
- [ ] Approve/reject migrations
- [ ] Schedule migrations
- [ ] Monitor migration progress
- [ ] View migration logs

## 📅 Week 3: Self-Service Signup

### Public Website
- [ ] Create landing page at `/`
- [ ] Pricing page with tier comparison
- [ ] Feature showcase
- [ ] Customer testimonials section
- [ ] Contact form

### Signup Flow
- [ ] Create `/signup` route
- [ ] Plan selection (Small/Medium/Institution)
- [ ] Orchestra registration form
- [ ] Subdomain availability check
- [ ] Admin user creation
- [ ] Email verification
- [ ] Success page with next steps

### Subdomain Routing
- [ ] Configure middleware for subdomain detection
- [ ] Update Next.js config for wildcard domains
- [ ] Test subdomain routing locally
- [ ] Implement subdomain → tenant resolution

### Trial Management
- [ ] Implement 30-day trial logic
- [ ] Trial expiry notifications
- [ ] Grace period handling
- [ ] Upgrade prompts in UI

## 📅 Week 4: Orchestra Admin Features

### Subscription Management
- [ ] Create `/admin/settings/subscription` page
- [ ] Display current plan and limits
- [ ] Show usage vs limits (progress bars)
- [ ] Upgrade/downgrade buttons
- [ ] Billing history

### User Invitation System
- [ ] Create `/admin/settings/users` page
- [ ] Invite users by email
- [ ] Set user roles (admin/user)
- [ ] Manage existing users
- [ ] Remove users

### Branding Customization
- [ ] Create `/admin/settings/branding` page
- [ ] Logo upload (Medium/Institution tiers)
- [ ] Color picker (Institution tier)
- [ ] Font selection (Institution tier)
- [ ] Preview changes

### Usage Monitoring
- [ ] Real-time musician count
- [ ] Active projects tracker
- [ ] Monthly request statistics
- [ ] Storage usage meter
- [ ] Export usage reports

## 📅 Week 5: Migration System

### Export Functionality
- [ ] Create data export functions
- [ ] Export all tenant data to JSON
- [ ] Include all relationships
- [ ] Compress large exports
- [ ] Secure file storage

### Import Functionality
- [ ] Create data import functions
- [ ] Validate data integrity
- [ ] Handle foreign keys correctly
- [ ] Progress tracking
- [ ] Error recovery

### Migration UI
- [ ] Request migration button (Orchestra admin)
- [ ] Migration approval UI (Superadmin)
- [ ] Schedule picker
- [ ] Progress monitoring
- [ ] Success/failure notifications

### Database Operations
- [ ] Create dedicated database via Neon API
- [ ] Run migrations on new database
- [ ] Import data with verification
- [ ] Update tenant configuration
- [ ] Clean up shared database

## 📅 Week 6: Billing & Payments

### Stripe Integration
- [ ] Set up Stripe account
- [ ] Install Stripe SDK
- [ ] Create products for each tier
- [ ] Set up pricing (monthly/annual)
- [ ] Webhook endpoints

### Payment Flow
- [ ] Credit card form
- [ ] Payment processing
- [ ] Success/failure handling
- [ ] Receipt generation
- [ ] Retry failed payments

### Subscription Management
- [ ] Create/update subscriptions
- [ ] Handle plan changes
- [ ] Proration calculation
- [ ] Cancel subscriptions
- [ ] Reactivation flow

### Invoice System (Institution tier)
- [ ] Generate invoices
- [ ] Custom invoice templates
- [ ] Send invoices via email
- [ ] Payment tracking
- [ ] Overdue notifications

## 🎯 Critical Path Items

These MUST be done in order:

1. **Tenant table and schema updates** (everything depends on this)
2. **User authentication** (can't have multiple users without it)
3. **Tenant isolation middleware** (security critical)
4. **Subdomain routing** (UX critical)
5. **Limit enforcement** (business model critical)

## 🚨 Launch Checklist

- [ ] 3+ orchestras using the system
- [ ] Data completely isolated between tenants
- [ ] Self-service signup operational
- [ ] Payment processing functional
- [ ] Support for 50+ concurrent orchestras
- [ ] Zero security vulnerabilities
- [ ] Complete documentation
- [ ] 99.9% uptime achieved

---

# Previous TODO - Single Orchestra System (98% COMPLETE)

## ✅ Fas 1: Grundsystem (AVKLARAD!)

### Avklarade uppgifter
- [x] Initiera Next.js projekt med TypeScript och Tailwind
- [x] Installera alla nödvändiga dependencies
- [x] Skapa komplett Prisma-schema med 14 tabeller
- [x] Konfigurera miljövariabler (.env och .env.local)
- [x] Skapa seed-data för instrument och positioner
- [x] Skapa grundläggande projektstruktur
- [x] Sätta upp Prisma och Supabase clients
- [x] Skapa utilities för ID-generering
- [x] Uppdatera startsida och layout
- [x] Skapa admin-layout med navigation
- [x] Implementera ID-sekvens tabell för att förhindra återanvändning
- [x] Bygga CRUD för musiker
  - [x] Lista alla musiker (med filtrering och sökning)
  - [x] Skapa ny musiker-formulär
  - [x] Redigera musiker
  - [x] Visa musikerprofil
- [x] Implementera kvalifikationshantering
  - [x] Dynamisk laddning baserat på valt instrument
  - [x] Spara/uppdatera kvalifikationer
- [x] Lägg till status-hantering
  - [x] Aktiv/Inaktiv toggle
  - [x] Arkivera musiker (soft delete)

## ✅ Fas 2: Rankningssystem (AVKLARAD!)

### Avklarade uppgifter
- [x] Skapa rankningslista-översikt
- [x] Implementera drag & drop med @dnd-kit
- [x] Bygga rankningslista-komponenter
  - [x] Visa musiker per lista
  - [x] Markera inaktiva musiker med badge
  - [x] Spara ändringar automatiskt vid drag & drop
- [x] Skapa rankningslistor (A/B/C med beskrivning)
- [x] Ta bort musiker från lista med X-knapp
- [x] Klickbara musikernamn som länkar till profil
- [x] Visa inaktiva musiker i "Lägg till musiker" modal
- [x] En musiker kan finnas i flera listor (A, B och C)
- [x] Konsekvent instrumentordning i hela systemet (2025-06-27)
  - [x] ReorderInstrumentsModal med drag-and-drop
  - [x] Pilknappar för reordering
  - [x] displayOrder fält i databasen
- [x] Ta bort tomma rankningslistor
- [x] Återskapa borttagna listor

## ✅ Fas 3: Projektsystem (AVKLARAD!)

### Avklarade uppgifter
- [x] CRUD för projekt
  - [x] Projektlista med intelligent sortering (kommande först, avslutade sist)
  - [x] Skapa nytt projekt-formulär med anteckningsfält
  - [x] Redigera projekt inklusive anteckningar
  - [x] Statushantering (Aktiv/Avslutad)
- [x] Implementera filuppladdning
  - [x] Base64-baserad uppladdning (Next.js 15 kompatibel)
  - [x] Ladda upp allmän projektinfo
  - [x] Ladda upp noter per instrument/behov
  - [x] Filhantering UI med återanvändning
- [x] Bemanningsbehov
  - [x] Lägg till behov med position och antal
  - [x] Välj rankningslista per behov
  - [x] Välj förfrågningsstrategi
  - [x] Sätt max mottagare för "först till kvarn"
- [x] Förbättrad projektöversikt
  - [x] Information-flik visar grundinfo och anteckningar
  - [x] Intelligent sortering av projekt

### Återstående mindre uppgifter
- [ ] Arkivera projekt (soft delete)
- [ ] Sökfunktion i projektlistan

## ✅ Fas 4: Förfrågningssystem (90% AVKLARAD)

### E-post setup ✅ (AVKLARAD)
- [x] Implementera e-postmallar
- [x] Skapa mall-editor i admin
- [x] CRUD för e-postmallar
- [x] Variabler i mallar ({{firstName}}, {{projectName}} etc.)
- [x] Seed-funktion för standardmallar
- [x] Fyra malltyper: request, reminder, confirmation, position_filled
- [x] Email-simulering i development mode
- [x] Resend-integration förberedd (kräver API-nyckel för produktion)

### Token-system ✅ (AVKLARAD 2025-06-26)
- [x] Generera säkra tokens
- [x] Token-tabell i databasen
- [x] Koppla tokens till requests
- [x] Implementera /api/respond endpoint (GET & POST)
- [x] Validera och hantera svar
- [x] Engångsanvändning av tokens
- [x] Response page (/respond) uppdaterad
- [x] Token visas i test-requests UI
- [x] Strategi-specifik hantering (cancelled status för first_come)
- [x] Token expiry baserat på responseTimeHours
- [x] Samma token återanvänds för påminnelser

### Förfrågningsstrategier ✅ (AVKLARAD 2025-06-26)
- [x] Sekventiell implementation
  - [x] Skicka en i taget
  - [x] Hantera NEJ/timeout
  - [x] Automatisk vidarebefordran
- [x] Parallell implementation
  - [x] Skicka till flera samtidigt (Promise.allSettled)
  - [x] Fylla upp vid NEJ
  - [x] Korrekt antal från första försöket
- [x] Först till kvarn
  - [x] Skicka till max antal eller hela listan
  - [x] Cancelled status när tjänst fylls
  - [x] "Position fylld" notification

### Automatiseringar ✅ (AVKLARAD 2025-06-27)
- [x] Påminnelsesystem implementerat (configurable %)
- [x] Timeout-hantering implementerad
- [x] Test-svarstider: 1 minut, 3 timmar för testning
- [x] "Skicka förfrågningar" knapp med bekräftelsedialog
- [x] Automatisk fil-distribution vid förfrågan (on_request)
- [x] Automatisk fil-distribution vid accept (on_accept)
- [ ] Queue-system för e-postutskick i produktion (nice-to-have)

### UI/UX Förbättringar ✅ (AVKLARAD 2025-06-27)
- [x] "Skicka förfrågningar" knapp i projektvy
- [x] Smart visning - bara när behov finns
- [x] Bekräftelsedialog med detaljerad information
- [x] Visar exakt vilka positioner och antal
- [x] Feedback om antal skickade förfrågningar
- [x] Förbättrad projektlayout med tydlig hierarki
  - [x] Globala knappar flyttade till Grundinformation
  - [x] Individuella knappar med sekundär styling
  - [x] Tooltips istället för statisk text
  - [x] Enhetlig knappstorlek (h-10)
- [x] "Pausa projekt" istället för "Pausa alla aktiva förfrågningar"
- [x] Orange varningsfärg för pausa-funktionen

### Test-system ✅ (AVKLARAD 2025-06-26)
- [x] Test Requests-sida för development
- [x] Skapa test-förfrågningar
- [x] Simulera svar (JA/NEJ)
- [x] Kör påminnelser manuellt
- [x] Kör timeouts manuellt
- [x] Använder samma `sendRequests` som produktion
- [x] Visar cancelled status korrekt

## 📊 Fas 5: Dashboard & Rapporter (DELVIS AVKLARAD)

### Avklarade uppgifter ✅ (2025-06-26)
- [x] Admin dashboard
  - [x] Dynamisk statistik från databasen
  - [x] Totalt antal musiker och aktiva
  - [x] Aktiva projekt och förfrågningar
  - [x] Väntande svar och påminnelser
  - [x] Svarsfrekvens senaste 30 dagarna
  - [x] Navigation omordnad: "Översikt" först
- [x] Projekt-detaljvy förbättringar
  - [x] Två-kolumns layout
  - [x] Visa repetitionsschema och konsertinfo
  - [x] Pausa/återuppta funktionalitet
  - [x] Grid-baserad knapp-alignment
- [x] Musikerprofil utökad
  - [x] Rankningar (alla listor musikern är med i)
  - [x] Projekthistorik (alla förfrågningar)
  - [x] Statistik (acceptansgrad, svarstid, mest efterfrågade)
- [x] Projektöversikt förbättringar
  - [x] Bemanningsgrad-indikator med färgkodning
  - [x] Visuell progressbar för varje projekt
  - [x] Exakt antal (accepterade/behövda) visas

### Återstående uppgifter
- [ ] Projektrapporter
  - [ ] Fyllnadsgrad per projekt
  - [ ] Tidsåtgång
  - [ ] Kostnadsöversikt
- [ ] Export-funktioner
  - [ ] Excel-export
  - [ ] PDF-rapporter
- [ ] Kommunikationshistorik
  - [ ] Visa alla mail per projekt
  - [ ] Sök i historik

## 🔒 Säkerhet & Optimering

- [x] Implementera ID-sekvenser (aldrig återanvänd ID)
- [ ] Rate limiting för API
- [ ] Input-validering överallt
- [ ] Audit logging för alla ändringar
- [ ] Error boundaries
- [x] Loading states (delvis implementerat)
- [ ] Optimera databas-queries
- [ ] Implementera caching där lämpligt
- [ ] **Byt tillbaka till direkt databas-URL** (från pooler) för bättre prestanda när DNS-problemet är löst

## 🚀 Fas 6: SaaS-transformation (FRAMTIDA)

**OBS**: Denna fas påbörjas först när alla andra faser är helt klara. Se `SAAS_ROADMAP.md` för detaljerad plan.

### Översikt
- [ ] Multi-tenant arkitektur
- [ ] Autentisering & användarhantering
- [ ] Prenumerationsplaner med Stripe
- [ ] Landningssida för marknadsföring
- [ ] Lösenordsskydd för admin-funktioner

### Huvudkomponenter
- [ ] **Autentisering** (NextAuth.js)
  - [ ] Login/signup flöde
  - [ ] Tenant isolation
  - [ ] Rollbaserad åtkomst
- [ ] **Multi-tenant databas**
  - [ ] TenantId i alla tabeller
  - [ ] Automatisk filtrering
  - [ ] Tenant-specifika ID:n
- [ ] **Prenumerationshantering**
  - [ ] Integration med Stripe
  - [ ] Usage tracking
  - [ ] Automatiska begränsningar
  - [ ] Uppgraderingsflöden

- [ ] **Landningssida**
  - [ ] Marketing site
  - [ ] Prisplaner
  - [ ] Demo-bokning
  - [ ] Knowledge base

### Prisplaner
- **Solo** (Gratis): 25 musiker, 2 projekt
- **Ensemble** (499 kr): 100 musiker, 10 projekt
- **Professional** (999 kr): 500 musiker, 50 projekt
- **Enterprise** (Offert): Obegränsat, egen databas

## 🧪 Testing

- [ ] Enhetstester för utilities
- [ ] Integrationstester för API
- [ ] E2E tester för kritiska flöden
- [ ] Testdata generator

## 📱 Responsiv Design

- [ ] Mobile-first approach
- [ ] Touch-vänlig drag & drop
- [ ] Responsiva tabeller
- [ ] Mobile navigation

## 📚 Dokumentation

- [ ] API-dokumentation
- [ ] Användarmanual för admin
- [ ] Deployment guide
- [ ] Backup & restore procedurer

## 🚀 Deployment

- [ ] Setup produktion på Vercel
- [ ] Konfigurera Supabase produktion
- [ ] DNS och domän
- [ ] SSL-certifikat
- [ ] Monitoring och alerts
- [ ] Backup-strategi

## 🔄 Kontinuerlig förbättring

- [ ] Användarfeedback system
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics

## ⏰ Tidsuppskattning

- **Fas 1**: AVKLARAD ✅
- **Fas 2**: AVKLARAD ✅
- **Fas 3**: AVKLARAD ✅
- **Fas 4**: 98% AVKLARAD ✅ (Saknar endast: produktionskonfiguration)
- **Fas 5**: 70% AVKLARAD ✅ (Dashboard, musikerprofil, projektvy klart)
- **Fas 6**: 2-3 månader (SaaS-transformation - FRAMTIDA)
- **Total MVP (Fas 1-5)**: ~0.5 dag kvar (endast deployment)
- **Total SaaS (Fas 1-6)**: ~3-4 månader

## 🎯 Nästa steg

### Prioritet 1 - Slutföra MVP ✅ (NÄSTAN KLAR!)
1. **Automatisk fildistribution** ✅ (AVKLARAD 2025-06-27)
   - När musiker får förfrågan bifogas "on_request" filer
   - När musiker accepterar bifogas "on_accept" filer
   - Fullt integrerat med Resend API

2. **Lösenordsskydd** ✅ (AVKLARAD 2025-06-27)
   - JWT-baserad autentisering implementerad
   - Rate limiting mot brute force
   - httpOnly cookies för säkerhet
   - Se `/docs/AUTHENTICATION.md` för detaljer

3. **Produktionskonfiguration** (0.5 dag) - SISTA STEGET!
   - Konfigurera Resend API-nyckel ✅ (redan klar)
   - Miljövariabler för produktion
   - Deployment på Vercel
   - Byt till direkt databasanslutning (från pooler)

### Prioritet 2 - Säkerhet & Polering
1. **Rate limiting** för API-anrop
2. **Input-validering** överallt
3. **Error boundaries** för bättre felhantering
4. **TypeScript-fel** åtgärda alla lint-fel
5. **Responsiv design** för mobil

### Prioritet 3 - Rapporter & Export (Post-MVP)
1. Projektrapporter (fyllnadsgrad, tidsåtgång)
2. Export-funktioner (Excel/PDF)
3. Kommunikationshistorik
4. Sökfunktion för musiker och projekt
5. Arkivera/återställa projekt

### ✅ Prioritet 4 - Gruppmail-funktion (AVKLARAD 2025-06-28)
1. **Ny menypost "Gruppmail"** i vänstermenyn ✅
2. **Filtrera mottagare** baserat på: ✅
   - Projekt (dropdown med veckonummer) ✅
   - Alla accepterade musiker (standard) ✅
   - Specifika instrument (multi-select) ✅
   - Specifika tjänster/positioner (multi-select) ✅
3. **Förhandsvisning av mottagare** (realtid) ✅
4. **E-postformulär** med ämne och meddelande ✅
5. **Batch-sändning** med Resend integration ✅
6. **UX-förbättringar** implementerade ✅
   - Veckonummer i subject line
   - Position-hierarki sortering
   - Visual feedback för disabled states
   - Confirmation dialogs för stora mottagarlistor

## 📌 Viktiga beslut att ta

- [ ] Val av e-postleverantör (Resend rekommenderat)
- [ ] Hosting (Vercel + Supabase rekommenderat)
- [ ] Domännamn
- [ ] Backup-strategi
- [ ] Support-process