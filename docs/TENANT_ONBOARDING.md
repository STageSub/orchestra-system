# 🎯 Tenant Onboarding Guide

## Overview

This guide covers the complete onboarding process for new orchestras joining StageSub, from initial signup through to active usage. We have two primary paths: self-service for Small/Medium ensembles and manual onboarding for Institution tier.

## Onboarding Paths

### 🚀 Self-Service Onboarding (Small/Medium Ensemble)

**Timeline: 5-10 minutes**

1. **Landing Page** → Choose plan → Click "Start Free Trial"
2. **Create Account** → Email, password, orchestra name
3. **Automatic Setup** → Subdomain, database, initial configuration
4. **Welcome Email** → Login credentials, getting started guide
5. **First Login** → Onboarding wizard
6. **Ready to Use** → 30-day trial begins

### 🤝 Manual Onboarding (Institution)

**Timeline: 1-3 days**

1. **Contact Sales** → Demo scheduled
2. **Requirements Gathering** → Custom needs assessment
3. **Contract & Pricing** → Negotiated terms
4. **Manual Setup** → CEO creates account
5. **Custom Configuration** → Branding, limits, preferences
6. **Training Session** → 1-on-1 onboarding call
7. **Go Live** → Full support during transition

## Self-Service Signup Flow

### Step 1: Landing Page

```typescript
// pages/signup.tsx
export default function SignupPage() {
  return (
    <div className="pricing-grid">
      <PricingCard
        title="Small Ensemble"
        price="$79"
        features={smallEnsembleFeatures}
        cta="Start Free Trial"
        href="/signup/small"
      />
      <PricingCard
        title="Medium Ensemble"
        price="$499"
        features={mediumEnsembleFeatures}
        cta="Start Free Trial"
        href="/signup/medium"
      />
      <PricingCard
        title="Institution"
        price="$1,500"
        features={institutionFeatures}
        cta="Contact Sales"
        href="/contact-sales"
      />
    </div>
  )
}
```

### Step 2: Registration Form

```typescript
// pages/signup/[plan].tsx
interface SignupFormData {
  // Orchestra Information
  orchestraName: string
  orchestraType: 'chamber' | 'symphony' | 'festival' | 'school' | 'other'
  country: string
  city: string
  
  // Admin User
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  
  // Preferences
  preferredLanguage: 'en' | 'sv'
  subdomain: string // Auto-generated from orchestra name
  
  // Terms
  acceptTerms: boolean
  acceptPrivacy: boolean
  subscribeNewsletter: boolean
}

export default function SignupForm({ plan }: { plan: 'small' | 'medium' }) {
  const [formData, setFormData] = useState<SignupFormData>()
  
  // Auto-generate subdomain
  useEffect(() => {
    if (formData.orchestraName) {
      const subdomain = formData.orchestraName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30)
      
      setFormData({ ...formData, subdomain })
    }
  }, [formData.orchestraName])
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const response = await fetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ ...formData, plan })
    })
    
    if (response.ok) {
      router.push('/signup/success')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Orchestra details */}
      {/* Admin user details */}
      {/* Subdomain preview: {subdomain}.stagesub.com */}
      {/* Terms acceptance */}
    </form>
  )
}
```

### Step 3: Backend Tenant Creation

```typescript
// api/signup/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  
  // 1. Validate subdomain availability
  const existing = await prisma.tenant.findUnique({
    where: { subdomain: data.subdomain }
  })
  
  if (existing) {
    return Response.json({ 
      error: 'Subdomain already taken' 
    }, { status: 400 })
  }
  
  // 2. Create tenant and admin user in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.orchestraName,
        subdomain: data.subdomain,
        subscription: data.plan,
        maxMusicians: data.plan === 'small' ? 50 : 200,
        maxActiveProjects: data.plan === 'small' ? 5 : 20,
        maxInstruments: data.plan === 'small' ? 10 : 999,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: {
          orchestraType: data.orchestraType,
          country: data.country,
          city: data.city,
          signupSource: 'self-service'
        }
      }
    })
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Create admin user
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'admin',
        tenantId: tenant.id
      }
    })
    
    // Initialize default data
    await initializeTenantData(tx, tenant.id)
    
    return { tenant, user }
  })
  
  // 3. Send welcome email
  await sendWelcomeEmail(result.user, result.tenant)
  
  // 4. Track signup event
  await trackEvent('tenant_signup', {
    tenantId: result.tenant.id,
    plan: data.plan,
    source: 'self-service'
  })
  
  return Response.json({ 
    success: true,
    subdomain: result.tenant.subdomain
  })
}
```

### Step 4: Initialize Default Data

```typescript
async function initializeTenantData(tx: PrismaTransaction, tenantId: string) {
  // 1. Create default instruments (orchestra standard)
  const instruments = [
    { name: 'Violin', displayOrder: 1 },
    { name: 'Viola', displayOrder: 2 },
    { name: 'Cello', displayOrder: 3 },
    { name: 'Kontrabas', displayOrder: 4 },
    { name: 'Flöjt', displayOrder: 5 },
    { name: 'Oboe', displayOrder: 6 },
    { name: 'Klarinett', displayOrder: 7 },
    { name: 'Fagott', displayOrder: 8 },
    { name: 'Valthorn', displayOrder: 9 },
    { name: 'Trumpet', displayOrder: 10 }
  ]
  
  for (const inst of instruments) {
    const instrument = await tx.instrument.create({
      data: {
        ...inst,
        tenantId,
        instrumentId: await generateUniqueId('instrument', tenantId)
      }
    })
    
    // Create default positions
    if (inst.name === 'Violin') {
      await tx.position.createMany({
        data: [
          { 
            instrumentId: instrument.id, 
            name: 'Förste konsertmästare', 
            hierarchyLevel: 1,
            positionId: await generateUniqueId('position', tenantId)
          },
          { 
            instrumentId: instrument.id, 
            name: 'Andre konsertmästare', 
            hierarchyLevel: 2,
            positionId: await generateUniqueId('position', tenantId)
          },
          { 
            instrumentId: instrument.id, 
            name: 'Tutti', 
            hierarchyLevel: 10,
            positionId: await generateUniqueId('position', tenantId)
          }
        ]
      })
    }
  }
  
  // 2. Create default email templates
  const templates = [
    {
      type: 'request',
      name: 'Standardförfrågan',
      subject: 'Förfrågan: {{projectName}} - {{positionName}}',
      content: `Hej {{firstName}},

Vi söker en {{positionName}} till {{projectName}} med start {{startDate}}.

Repetitionsschema: {{rehearsalSchedule}}
Konsertinformation: {{concertInfo}}

Vänligen svara inom {{responseTime}} timmar genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
{{orchestraName}}`
    },
    {
      type: 'confirmation',
      name: 'Bekräftelse',
      subject: 'Bekräftelse: {{projectName}}',
      content: `Hej {{firstName}},

Tack för att du accepterat att spela {{positionName}} i {{projectName}}.

{{attachmentNote}}

Vi ser fram emot att arbeta med dig!

Med vänliga hälsningar,
{{orchestraName}}`
    }
  ]
  
  for (const template of templates) {
    await tx.emailTemplate.create({
      data: {
        ...template,
        tenantId,
        isDefault: true
      }
    })
  }
  
  // 3. Create sample ranking list
  await tx.rankingList.create({
    data: {
      name: 'A',
      description: 'Huvudlista',
      instrumentId: instruments[0].id,
      positionId: null, // All positions
      tenantId
    }
  })
}
```

### Step 5: Welcome Email

```typescript
async function sendWelcomeEmail(user: User, tenant: Tenant) {
  const loginUrl = `https://${tenant.subdomain}.stagesub.com/admin`
  
  await sendEmail({
    to: user.email,
    subject: 'Välkommen till StageSub!',
    html: `
      <h2>Välkommen ${user.firstName}!</h2>
      
      <p>Ditt StageSub-konto för ${tenant.name} är nu aktiverat.</p>
      
      <h3>Kom igång:</h3>
      <ol>
        <li>Logga in på: <a href="${loginUrl}">${loginUrl}</a></li>
        <li>Lägg till dina musiker</li>
        <li>Skapa ditt första projekt</li>
        <li>Skicka din första förfrågan</li>
      </ol>
      
      <h3>Din 30-dagars gratis testperiod</h3>
      <p>Du har full tillgång till alla funktioner i ${tenant.subscription} planen fram till ${formatDate(tenant.trialEndsAt)}.</p>
      
      <h3>Behöver du hjälp?</h3>
      <ul>
        <li><a href="https://stagesub.com/docs">Dokumentation</a></li>
        <li><a href="https://stagesub.com/videos">Video-guider</a></li>
        <li>Email: support@stagesub.com</li>
      </ul>
      
      <p>Vi finns här om du har några frågor!</p>
      
      <p>Vänliga hälsningar,<br>StageSub-teamet</p>
    `
  })
}
```

## First Login Experience

### Onboarding Wizard

```typescript
// components/onboarding-wizard.tsx
export function OnboardingWizard({ tenant }: { tenant: Tenant }) {
  const [step, setStep] = useState(0)
  const steps = [
    { title: 'Välkommen', component: WelcomeStep },
    { title: 'Lägg till musiker', component: AddMusiciansStep },
    { title: 'Skapa projekt', component: CreateProjectStep },
    { title: 'Anpassa inställningar', component: SettingsStep },
    { title: 'Klart!', component: CompleteStep }
  ]
  
  return (
    <div className="onboarding-wizard">
      <ProgressBar current={step} total={steps.length} />
      
      <CurrentStepComponent
        tenant={tenant}
        onNext={() => setStep(step + 1)}
        onSkip={() => setComplete(true)}
      />
    </div>
  )
}

// Step 1: Welcome
function WelcomeStep({ tenant, onNext }) {
  return (
    <div className="text-center py-12">
      <h1>Välkommen till StageSub, {tenant.name}!</h1>
      <p>Låt oss hjälpa dig komma igång på 5 minuter.</p>
      
      <div className="mt-8 grid grid-cols-3 gap-4">
        <FeatureHighlight
          icon={<Users />}
          title="Hantera musiker"
          description="Organisera alla dina musiker på ett ställe"
        />
        <FeatureHighlight
          icon={<Calendar />}
          title="Planera projekt"
          description="Skapa projekt och definiera behov"
        />
        <FeatureHighlight
          icon={<Send />}
          title="Skicka förfrågningar"
          description="Kontakta rätt musiker automatiskt"
        />
      </div>
      
      <button onClick={onNext} className="mt-8">
        Kom igång →
      </button>
    </div>
  )
}

// Step 2: Add Musicians
function AddMusiciansStep({ tenant, onNext, onSkip }) {
  const [method, setMethod] = useState<'manual' | 'import'>('manual')
  
  return (
    <div>
      <h2>Lägg till dina musiker</h2>
      <p>Du kan lägga till musiker manuellt eller importera från en fil.</p>
      
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setMethod('manual')}
          className={method === 'manual' ? 'active' : ''}
        >
          Lägg till manuellt
        </button>
        <button
          onClick={() => setMethod('import')}
          className={method === 'import' ? 'active' : ''}
        >
          Importera från fil
        </button>
      </div>
      
      {method === 'manual' ? (
        <QuickAddMusician onAdd={handleAdd} />
      ) : (
        <ImportMusicians onImport={handleImport} />
      )}
      
      <div className="flex justify-between mt-8">
        <button onClick={onSkip}>Hoppa över</button>
        <button onClick={onNext}>Fortsätt →</button>
      </div>
    </div>
  )
}
```

## Manual Onboarding (Institution)

### 1. Sales Process

```typescript
// Handled outside the system:
// - Initial contact via sales@stagesub.com
// - Demo meeting scheduled
// - Requirements documented
// - Contract negotiated
// - Payment terms agreed
```

### 2. CEO Creates Tenant

```typescript
// superadmin/tenants/new
export function CreateInstitutionTenant() {
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    subdomain: '',
    adminEmail: '',
    
    // Subscription
    subscription: 'institution',
    customLimits: {
      maxMusicians: null, // unlimited
      maxActiveProjects: null,
      maxInstruments: null
    },
    
    // Branding
    customBranding: {
      logoUrl: '',
      primaryColor: '#1e40af',
      fontFamily: 'Inter'
    },
    emailDomain: '', // e.g., 'symphony.se'
    
    // Configuration
    databaseType: 'shared', // or 'dedicated'
    billingType: 'invoice',
    invoiceEmail: '',
    
    // Notes
    internalNotes: '',
    specialRequirements: ''
  })
  
  const handleSubmit = async () => {
    // Create tenant with special configuration
    const tenant = await createInstitutionTenant(formData)
    
    // Send invitation to admin
    await sendAdminInvitation(tenant.id, formData.adminEmail)
    
    // Schedule onboarding call
    await scheduleOnboarding(tenant.id)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Comprehensive form for institution setup */}
    </form>
  )
}
```

### 3. Custom Configuration

```typescript
async function createInstitutionTenant(data: InstitutionTenantData) {
  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      subdomain: data.subdomain,
      subscription: 'institution',
      
      // No limits for institution
      maxMusicians: 999999,
      maxActiveProjects: 999999,
      maxInstruments: 999999,
      
      // Custom branding
      customBranding: data.customBranding,
      emailDomain: data.emailDomain,
      
      // Billing
      metadata: {
        billingType: 'invoice',
        invoiceEmail: data.invoiceEmail,
        contractStart: new Date(),
        contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        specialRequirements: data.specialRequirements
      }
    }
  })
  
  // Initialize with full orchestra setup
  await initializeInstitutionData(tenant.id)
  
  // Configure custom email domain
  if (data.emailDomain) {
    await configureEmailDomain(tenant.id, data.emailDomain)
  }
  
  return tenant
}
```

### 4. Institution-Specific Setup

```typescript
async function initializeInstitutionData(tenantId: string) {
  // Create complete orchestra instrument set
  const fullOrchestraInstruments = [
    // Strings
    { name: 'Violin 1', displayOrder: 1 },
    { name: 'Violin 2', displayOrder: 2 },
    { name: 'Viola', displayOrder: 3 },
    { name: 'Cello', displayOrder: 4 },
    { name: 'Kontrabas', displayOrder: 5 },
    
    // Woodwinds
    { name: 'Piccolo', displayOrder: 6 },
    { name: 'Flöjt', displayOrder: 7 },
    { name: 'Oboe', displayOrder: 8 },
    { name: 'Engelskt horn', displayOrder: 9 },
    { name: 'Klarinett', displayOrder: 10 },
    { name: 'Basklarinett', displayOrder: 11 },
    { name: 'Fagott', displayOrder: 12 },
    { name: 'Kontrafagott', displayOrder: 13 },
    
    // Brass
    { name: 'Valthorn', displayOrder: 14 },
    { name: 'Trumpet', displayOrder: 15 },
    { name: 'Trombon', displayOrder: 16 },
    { name: 'Bastrombon', displayOrder: 17 },
    { name: 'Tuba', displayOrder: 18 },
    
    // Percussion
    { name: 'Pukor', displayOrder: 19 },
    { name: 'Slagverk', displayOrder: 20 },
    
    // Other
    { name: 'Harpa', displayOrder: 21 },
    { name: 'Piano', displayOrder: 22 },
    { name: 'Celesta', displayOrder: 23 }
  ]
  
  // Create all instruments with full position hierarchy
  for (const inst of fullOrchestraInstruments) {
    await createInstrumentWithPositions(tenantId, inst)
  }
  
  // Create advanced email templates
  await createInstitutionEmailTemplates(tenantId)
  
  // Create sample projects for training
  await createSampleProjects(tenantId)
}
```

## Onboarding Checklist

### For Self-Service Customers

- [ ] Account created successfully
- [ ] Subdomain accessible
- [ ] Welcome email received
- [ ] First login completed
- [ ] Onboarding wizard started
- [ ] At least 1 musician added
- [ ] At least 1 project created
- [ ] First request sent (optional)
- [ ] Billing information added (before trial ends)

### For Institution Customers

- [ ] Contract signed
- [ ] Tenant created by CEO
- [ ] Custom configuration completed
- [ ] Admin user invited
- [ ] Branding uploaded
- [ ] Email domain configured (if applicable)
- [ ] Training session scheduled
- [ ] Data migration planned (if needed)
- [ ] Go-live date confirmed
- [ ] Support channels established

## Post-Onboarding Support

### Automated Emails

```typescript
// Day 3: Check-in
async function sendDay3CheckIn(tenant: Tenant) {
  if (tenant.stats.musiciansCount === 0) {
    await sendEmail({
      template: 'onboarding_reminder_musicians',
      data: { tenant }
    })
  }
}

// Day 7: Feature highlight
async function sendDay7FeatureHighlight(tenant: Tenant) {
  await sendEmail({
    template: 'feature_highlight_ranking_lists',
    data: { tenant }
  })
}

// Day 14: Success check
async function sendDay14SuccessCheck(tenant: Tenant) {
  if (tenant.stats.requestsSent === 0) {
    await sendEmail({
      template: 'onboarding_help_first_request',
      data: { tenant }
    })
  }
}

// Day 25: Trial ending reminder
async function sendTrialEndingReminder(tenant: Tenant) {
  await sendEmail({
    template: 'trial_ending_reminder',
    data: { 
      tenant,
      daysLeft: 5,
      upgradeUrl: `https://${tenant.subdomain}.stagesub.com/admin/billing`
    }
  })
}
```

### Success Metrics

Track these metrics to measure onboarding success:

```typescript
interface OnboardingMetrics {
  timeToFirstLogin: number // minutes
  timeToFirstMusician: number // hours
  timeToFirstProject: number // days
  timeToFirstRequest: number // days
  onboardingCompletion: number // 0-100%
  trialConversion: boolean
}

// Dashboard for tracking cohort success
interface CohortAnalysis {
  period: string // '2025-Q1'
  signups: number
  completed_onboarding: number // >80% steps
  sent_first_request: number
  converted_to_paid: number
  averageTimeToValue: number // hours to first request
}
```

## Common Issues & Solutions

### Subdomain Already Taken
- Suggest alternatives
- Allow manual override
- Check for inactive tenants

### Email Verification
- Send verification email
- Allow resend
- Provide manual verification option

### Browser Compatibility
- Test onboarding in all major browsers
- Provide fallbacks for older browsers
- Clear browser requirements

### Language Barriers
- Offer Swedish and English
- Translate all onboarding materials
- Provide language selector

## Continuous Improvement

1. **Track drop-off points** in onboarding wizard
2. **A/B test** different onboarding flows
3. **Collect feedback** after first week
4. **Iterate based on data** not assumptions
5. **Personalize based on** orchestra type
6. **Celebrate successes** when milestones reached