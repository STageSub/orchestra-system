import { NextRequest, NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { hashPassword } from '@/lib/auth-edge'
import { generateUniqueId } from '@/lib/id-generator'
import { sendEmail } from '@/lib/email'

const PLAN_LIMITS = {
  small_ensemble: {
    maxMusicians: 50,
    maxProjects: 5,
    maxInstruments: 10
  },
  medium_ensemble: {
    maxMusicians: 200,
    maxProjects: 20,
    maxInstruments: -1 // Unlimited
  },
  institution: {
    maxMusicians: -1, // Unlimited
    maxProjects: -1,
    maxInstruments: -1
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'organizationName', 'subdomain', 'plan',
      'firstName', 'lastName', 'email', 'password'
    ]
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ 
          error: `${field} is required` 
        }, { status: 400 })
      }
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
      return NextResponse.json({ 
        error: 'Invalid subdomain format' 
      }, { status: 400 })
    }

    // Check if subdomain is available
    const existingTenant = await prismaMultitenant.tenant.findUnique({
      where: { subdomain: data.subdomain }
    })

    if (existingTenant) {
      return NextResponse.json({ 
        error: 'Subdomain already taken' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prismaMultitenant.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already registered' 
      }, { status: 400 })
    }

    // Start transaction to create tenant and admin user
    const result = await prismaMultitenant.$transaction(async (tx) => {
      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          id: generateUniqueId('tenant'),
          name: data.organizationName,
          subdomain: data.subdomain,
          plan: data.plan,
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          settings: {
            customBranding: {},
            emailSettings: {
              fromName: data.organizationName,
              replyTo: data.email
            },
            limits: PLAN_LIMITS[data.plan as keyof typeof PLAN_LIMITS]
          }
        }
      })

      // Hash the password
      const hashedPassword = await hashPassword(data.password)

      // Create the admin user
      const user = await tx.user.create({
        data: {
          id: generateUniqueId('user'),
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
          phone: data.phone || null,
          role: 'admin',
          tenantId: tenant.id,
          isActive: false, // Requires email verification
          emailVerified: false,
          verificationToken: generateVerificationToken()
        }
      })

      // Create default email templates for the tenant
      await createDefaultTemplates(tx, tenant.id)

      // Create default instruments and positions
      await createDefaultInstruments(tx, tenant.id)

      return { tenant, user }
    })

    // Send verification email
    await sendVerificationEmail(result.user)

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      subdomain: result.tenant.subdomain
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ 
      error: 'Failed to create account' 
    }, { status: 500 })
  }
}

function generateVerificationToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sendVerificationEmail(user: any) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.verificationToken}`
  
  await sendEmail({
    to: user.email,
    subject: 'Verifiera din e-postadress - StageSub',
    html: `
      <h2>Välkommen till StageSub!</h2>
      <p>Hej ${user.firstName},</p>
      <p>Tack för att du registrerat dig. Klicka på länken nedan för att verifiera din e-postadress:</p>
      <p><a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verifiera e-post</a></p>
      <p>Om knappen inte fungerar kan du kopiera och klistra in denna länk i din webbläsare:</p>
      <p>${verificationUrl}</p>
      <p>Länken är giltig i 24 timmar.</p>
      <br>
      <p>Med vänliga hälsningar,<br>StageSub-teamet</p>
    `
  })
}

async function createDefaultTemplates(tx: any, tenantId: string) {
  const defaultTemplates = [
    {
      type: 'request',
      name: 'Förfrågan om vikariat',
      subject: 'Vikarieförfrågan: {{projectName}}',
      body: `Hej {{firstName}},

Vi skulle vilja erbjuda dig att vikariera som {{positionName}} i {{projectName}}.

Projektet startar: {{startDate}}

Vänligen svara inom {{responseTime}} timmar genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
{{organizationName}}`
    },
    {
      type: 'reminder',
      name: 'Påminnelse om vikariat',
      subject: 'Påminnelse: Vikarieförfrågan {{projectName}}',
      body: `Hej {{firstName}},

Detta är en påminnelse om vår tidigare förfrågan gällande vikariat som {{positionName}} i {{projectName}}.

Vänligen svara så snart som möjligt:
{{responseUrl}}

Med vänliga hälsningar,
{{organizationName}}`
    },
    {
      type: 'confirmation',
      name: 'Bekräftelse av vikariat',
      subject: 'Bekräftelse: {{projectName}}',
      body: `Hej {{firstName}},

Tack för att du accepterat vikariatet som {{positionName}} i {{projectName}}.

Vi ser fram emot att arbeta med dig!

Med vänliga hälsningar,
{{organizationName}}`
    }
  ]

  for (const template of defaultTemplates) {
    await tx.emailTemplate.create({
      data: {
        ...template,
        tenantId
      }
    })
  }
}

async function createDefaultInstruments(tx: any, tenantId: string) {
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
    { name: 'Trumpet', displayOrder: 10 },
    { name: 'Trombon', displayOrder: 11 },
    { name: 'Tuba', displayOrder: 12 },
    { name: 'Slagverk', displayOrder: 13 },
    { name: 'Harpa', displayOrder: 14 }
  ]

  const positions = {
    'Violin': ['Konsertmästare', '1:a violin', '2:a violin'],
    'Viola': ['Stämledare', 'Tutti'],
    'Cello': ['Stämledare', 'Tutti'],
    'Kontrabas': ['Stämledare', 'Tutti']
  }

  for (const instrument of instruments) {
    const createdInstrument = await tx.instrument.create({
      data: {
        id: generateUniqueId('instrument'),
        name: instrument.name,
        displayOrder: instrument.displayOrder,
        tenantId
      }
    })

    // Create default positions for this instrument
    const instrumentPositions = positions[instrument.name] || ['Tutti']
    
    for (let i = 0; i < instrumentPositions.length; i++) {
      await tx.position.create({
        data: {
          id: generateUniqueId('position'),
          name: instrumentPositions[i],
          instrumentId: createdInstrument.id,
          hierarchy: i + 1,
          tenantId
        }
      })
    }
  }
}