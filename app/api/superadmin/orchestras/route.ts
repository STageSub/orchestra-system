import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { getPrisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { getSupabaseManagement } from '@/lib/supabase-management'
import { hashPassword } from '@/lib/auth-db'

interface OrchestraConfig {
  id: string
  name: string
  subdomain: string
  contactName: string
  contactEmail: string
  databaseUrl?: string
  createdAt: string
  status: 'pending' | 'active' | 'inactive'
}

export async function GET() {
  try {
    const prisma = await getPrisma()
    const orchestras = await prisma.orchestra.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    const configs: OrchestraConfig[] = orchestras.map(o => ({
      id: o.id,
      name: o.name,
      subdomain: o.subdomain,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      databaseUrl: o.databaseUrl || undefined,
      createdAt: o.createdAt.toISOString(),
      status: o.status as 'pending' | 'active' | 'inactive'
    }))
    
    return NextResponse.json(configs)
  } catch (error) {
    console.error('Failed to get orchestra configs:', error)
    // Log mer detaljerad info för debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Kunde inte hämta orkesterkonfigurationer' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let createdOrchestra: { id: string; name: string; subdomain: string; contactName: string; contactEmail: string; createdAt: Date } | null = null
  let createdUser: { id: string } | null = null
  
  try {
    const prisma = await getPrisma()
  const prisma = await getPrismaForUser(request)
    const { name, subdomain, contactName, contactEmail } = await request.json()

    // Validate input
    if (!name || !subdomain || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Alla fält är obligatoriska' },
        { status: 400 }
      )
    }

    // Kör pre-flight kontroller
    console.log('🛫 Kör pre-flight kontroller...')
    const { runOrchestraPreflightChecks } = await import('@/lib/orchestra-preflight')
    const preflightResult = await runOrchestraPreflightChecks(subdomain, name, contactEmail)
    
    if (!preflightResult.canCreate) {
      console.error('Pre-flight kontroller misslyckades:', preflightResult.issues)
      return NextResponse.json(
        { 
          error: 'Orkestern kan inte skapas',
          preflightIssues: preflightResult.issues,
          suggestions: preflightResult.suggestions
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Pre-flight kontroller godkända')

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomänen får endast innehålla små bokstäver, siffror och bindestreck' },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existing = await prisma.orchestra.findUnique({
      where: { subdomain }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Subdomänen finns redan' },
        { status: 400 }
      )
    }

    // Create new orchestra config with pending status
    createdOrchestra = await prisma.orchestra.create({
      data: {
        name,
        subdomain,
        contactName,
        contactEmail,
        status: 'pending' // Will be updated to active after provisioning
      }
    })

    // Check if we should use automatic provisioning
    const useAutomaticProvisioning = process.env.SUPABASE_MANAGEMENT_TOKEN && process.env.SUPABASE_ORGANIZATION_ID

    let databaseUrl: string
    let directUrl: string | undefined
    let adminCredentials: { username: string; password: string; email: string } | undefined

    if (useAutomaticProvisioning) {
      // Create new Supabase project automatically
      try {
        const supabaseManagement = getSupabaseManagement()
        
        // Generate secure password
        const dbPassword = supabaseManagement.generateSecurePassword()
        
        // Create the project
        const project = await supabaseManagement.createProject({
          name: `Orchestra ${subdomain}`,
          dbPass: dbPassword,
          region: 'eu-north-1' // Stockholm region
        })

        // Wait for project to be ready
        await supabaseManagement.waitForProjectReady(project.id)

        // Get connection strings
        databaseUrl = await supabaseManagement.getConnectionString(project.id, dbPassword)
        directUrl = await supabaseManagement.getDirectConnectionString(project.id, dbPassword)

        console.log(`New Supabase project created for ${subdomain}`)
        
        // Validera att databasen inte redan används (extra säkerhet)
        const dbCheck = await prisma.orchestra.findFirst({
          where: { databaseUrl: databaseUrl }
        })
        
        if (dbCheck) {
          console.error(`VARNING: Nyskapad databas används redan av ${dbCheck.name}!`)
          // Detta borde aldrig hända med automatisk provisionering
        }
      } catch (error) {
        console.error('Failed to create Supabase project:', error)
        
        // Check if it's a quota limit error
        const errorMessage = error instanceof Error ? error.message : ''
        if (errorMessage.includes('project limit')) {
          console.log('Project limit reached, falling back to pooled databases')
          
          // Don't delete the orchestra, try pooled approach instead
          useAutomaticProvisioning = false
          
          // Continue to pooled database logic below
        } else {
          // Other errors - delete the orchestra record
          if (createdOrchestra) {
            await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
          }
          return NextResponse.json(
            { error: 'Kunde inte skapa databas automatiskt. Kontrollera Supabase-konfigurationen.' },
            { status: 500 }
          )
        }
      }
    } else {
      // Fall back to pool-based approach
      const poolDatabases = [
        process.env.DATABASE_URL_POOL_1,
        process.env.DATABASE_URL_POOL_2,
      ].filter(Boolean)

      if (poolDatabases.length === 0) {
        // Delete the orchestra record if no provisioning method available
        if (createdOrchestra) {
          await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
        }
        return NextResponse.json(
          { error: 'Ingen databasprovisionering konfigurerad. Lägg till SUPABASE_MANAGEMENT_TOKEN eller DATABASE_URL_POOL_* i miljövariabler.' },
          { status: 503 }
        )
      }

      // Check which databases are already assigned
      const assignedDatabases = await prisma.orchestra.findMany({
        where: {
          databaseUrl: { not: null }
        },
        select: { databaseUrl: true }
      })

      const assignedUrls = assignedDatabases.map(o => o.databaseUrl).filter(Boolean)

      // Find first available database
      const availableDb = poolDatabases.find(dbUrl => !assignedUrls.includes(dbUrl))

      if (!availableDb) {
        // Delete the orchestra record if no database available
        if (createdOrchestra) {
          await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
        }
        return NextResponse.json(
          { error: 'Alla poolade databaser är redan tilldelade' },
          { status: 503 }
        )
      }

      databaseUrl = availableDb
    }

    // KRITISK VALIDERING: Kontrollera att databasen inte redan används
    const existingWithSameDb = await prisma.orchestra.findFirst({
      where: { 
        databaseUrl: databaseUrl,
        id: { not: createdOrchestra.id }
      }
    })

    if (existingWithSameDb) {
      // Ta bort den skapade orkestern
      await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
      
      return NextResponse.json(
        { 
          error: `KRITISKT: Databas används redan av ${existingWithSameDb.name}! Varje orkester MÅSTE ha sin egen databas.`,
          details: {
            conflictingOrchestra: existingWithSameDb.name,
            subdomain: existingWithSameDb.subdomain
          }
        },
        { status: 409 }
      )
    }

    // Update the orchestra record with the assigned database
    await prisma.orchestra.update({
      where: { id: createdOrchestra.id },
      data: { 
        databaseUrl: databaseUrl,
        status: 'pending' // Vänta med active tills health check är klar
      }
    })

    // Kör databas health check
    console.log('🏥 Kör databas hälsokontroll...')
    const { checkDatabaseHealth, verifyDatabaseIsolation, formatHealthCheckResult } = await import('@/lib/database-health-check')
    
    const healthCheck = await checkDatabaseHealth(databaseUrl, subdomain)
    console.log(formatHealthCheckResult(healthCheck))
    
    if (!healthCheck.healthy) {
      // Något är fel med databasen
      console.error('Databas health check misslyckades')
      
      // Ta bort orkestern om databasen inte fungerar
      await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
      
      return NextResponse.json(
        { 
          error: 'Databas hälsokontroll misslyckades',
          healthCheck: healthCheck.details
        },
        { status: 500 }
      )
    }
    
    // Verifiera isolation
    const allOrchestras = await prisma.orchestra.findMany({
      select: { subdomain: true, databaseUrl: true }
    })
    
    const isIsolated = await verifyDatabaseIsolation(databaseUrl, subdomain, allOrchestras)
    
    if (!isIsolated) {
      console.error('KRITISKT: Databasisolering bruten!')
      await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
      
      return NextResponse.json(
        { error: 'Databasisolering kunde inte garanteras' },
        { status: 500 }
      )
    }
    
    // Allt OK - uppdatera till active
    await prisma.orchestra.update({
      where: { id: createdOrchestra.id },
      data: { status: 'active' }
    })

    // Update environment variable dynamically
    process.env[`DATABASE_URL_${subdomain.toUpperCase()}`] = databaseUrl

    // Store migration instructions for manual setup
    let migrationInstructions: { command: string; projectId?: string } | undefined
    
    // If we have a direct URL, prepare migration instructions
    if (directUrl) {
      console.log('Preparing migration instructions for new database...')
      
      // Extract project ID from the database URL
      const projectIdMatch = databaseUrl.match(/postgres\.([a-z]+):/);
      const projectId = projectIdMatch ? projectIdMatch[1] : undefined;
      
      migrationInstructions = {
        command: `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`,
        projectId
      }
    }

    // Generate admin user credentials
    const adminPassword = generatePassword()
    const adminUsername = `${subdomain}-admin`

    // Create admin user in the superadmin database
    createdUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: contactEmail,
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
        orchestraId: createdOrchestra.id,
        active: true
      }
    })

    adminCredentials = {
      username: adminUsername,
      password: adminPassword,
      email: contactEmail
    }

    console.log(`Created admin user: ${adminUsername}`)

    // If we're using automatic provisioning, we need migrations first
    if (useAutomaticProvisioning && migrationInstructions) {
      // Don't try to seed data - tables don't exist yet
      // Return success with migration instructions
      return NextResponse.json({
        success: true,
        orchestra: {
          id: createdOrchestra.id,
          name: createdOrchestra.name,
          subdomain: createdOrchestra.subdomain,
          contactName: createdOrchestra.contactName,
          contactEmail: createdOrchestra.contactEmail,
          createdAt: createdOrchestra.createdAt.toISOString(),
          status: 'pending' // Keep as pending until migrations are run
        },
        databaseUrl: databaseUrl,
        adminCredentials,
        message: 'Orkester och databas skapad! Migrationer krävs innan systemet kan användas.',
        setupComplete: false,
        requiresMigration: true,
        migrationInstructions
      })
    }

    // For pooled databases, we can seed data immediately
    const targetPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })

    try {
      // Seed initial data only for pooled databases
      console.log('Seeding initial data for', name)
      await seedOrchestraData(targetPrisma, name)
      console.log('Database seeded successfully!')

      await targetPrisma.$disconnect()

      // Return success with all information
      return NextResponse.json({
        success: true,
        orchestra: {
          id: createdOrchestra.id,
          name: createdOrchestra.name,
          subdomain: createdOrchestra.subdomain,
          contactName: createdOrchestra.contactName,
          contactEmail: createdOrchestra.contactEmail,
          createdAt: createdOrchestra.createdAt.toISOString(),
          status: 'active'
        },
        databaseUrl: databaseUrl,
        adminCredentials,
        message: 'Orkester skapad med poolad databas!',
        setupComplete: true,
        requiresMigration: false,
        migrationInstructions: undefined
      })
    } catch (seedError) {
      console.error('Failed to seed database:', seedError)
      await targetPrisma.$disconnect()
      
      // Rollback: update orchestra to pending status
      await prisma.orchestra.update({
        where: { id: createdOrchestra.id },
        data: { 
          databaseUrl: null,
          status: 'pending'
        }
      })

      throw seedError
    }
  } catch (error) {
    console.error('Failed to create orchestra:', error)
    
    // Clean up in reverse order
    try {
      // Delete user first if created
      if (createdUser) {
        await prisma.user.delete({ where: { id: createdUser.id } })
        console.log('Cleaned up user')
      }
      
      // Then delete orchestra
      if (createdOrchestra) {
        await prisma.orchestra.delete({ where: { id: createdOrchestra.id } })
        console.log('Cleaned up orchestra')
      }
    } catch (deleteError) {
      console.error('Failed to clean up:', deleteError)
    }
    
    // Return specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel'
    
    return NextResponse.json(
      { error: 'Kunde inte skapa orkester', details: errorMessage },
      { status: 500 }
    )
  }
}


// Helper function to generate secure password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper function to seed orchestra data
async function seedOrchestraData(targetPrisma: PrismaClient, orchestraName: string) {
  // Create default email templates
  const emailTemplates = [
    {
      id: 'template-request-sv',
      type: 'request',
      subject: 'Förfrågan om vikarietjänst - {{projectName}}',
      body: `Hej {{firstName}},

Vi söker en {{positionName}} för {{projectName}} med start {{startDate}}.

Vänligen svara inom {{responseTime}} timmar genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate', 'responseTime', 'responseUrl']
    },
    {
      id: 'template-reminder-sv',
      type: 'reminder',
      subject: 'Påminnelse: Förfrågan om vikarietjänst - {{projectName}}',
      body: `Hej {{firstName}},

Detta är en påminnelse om vår förfrågan gällande vikarietjänst som {{positionName}} för {{projectName}}.

Vänligen svara snarast genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'responseUrl']
    },
    {
      id: 'template-confirmation-sv',
      type: 'confirmation',
      subject: 'Bekräftelse: {{projectName}}',
      body: `Hej {{firstName}},

Tack för att du accepterat uppdraget som {{positionName}} för {{projectName}}.

Start: {{startDate}}

Vi återkommer med mer information.

Med vänliga hälsningar,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate']
    },
    {
      id: 'template-position-filled-sv',
      type: 'position_filled',
      subject: 'Tjänsten är tillsatt - {{projectName}}',
      body: `Hej {{firstName}},

Tack för ditt intresse för tjänsten som {{positionName}} för {{projectName}}.

Tjänsten är nu tillsatt.

Med vänliga hälsningar,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName']
    }
  ]

  for (const template of emailTemplates) {
    await targetPrisma.emailTemplate.create({
      data: {
        emailTemplateId: template.id,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables
      }
    })
  }

  // Create English email templates
  const englishTemplates = [
    {
      id: 'template-request-en',
      type: 'request_en',
      subject: 'Substitute Request - {{projectName}}',
      body: `Hello {{firstName}},

We are looking for a {{positionName}} for {{projectName}} starting {{startDate}}.

Please respond within {{responseTime}} hours by clicking the link below:
{{responseUrl}}

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate', 'responseTime', 'responseUrl']
    },
    {
      id: 'template-reminder-en',
      type: 'reminder_en',
      subject: 'Reminder: Substitute Request - {{projectName}}',
      body: `Hello {{firstName}},

This is a reminder about our request for the {{positionName}} position in {{projectName}}.

Please respond as soon as possible by clicking the link below:
{{responseUrl}}

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'responseUrl']
    },
    {
      id: 'template-confirmation-en',
      type: 'confirmation_en',
      subject: 'Confirmation: {{projectName}}',
      body: `Hello {{firstName}},

Thank you for accepting the position as {{positionName}} for {{projectName}}.

Start date: {{startDate}}

We will send you more information soon.

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName', 'startDate']
    },
    {
      id: 'template-position-filled-en',
      type: 'position_filled_en',
      subject: 'Position Filled - {{projectName}}',
      body: `Hello {{firstName}},

Thank you for your interest in the {{positionName}} position for {{projectName}}.

The position has now been filled.

Best regards,
${orchestraName}`,
      variables: ['firstName', 'projectName', 'positionName']
    }
  ]

  for (const template of englishTemplates) {
    await targetPrisma.emailTemplate.create({
      data: {
        emailTemplateId: template.id,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables
      }
    })
  }

  // Create instruments with positions and ranking lists
  const instrumentsData = [
    {
      name: 'Violin',
      displayOrder: 1,
      positions: [
        { name: 'Förste konsertmästare', hierarchyLevel: 1 },
        { name: 'Andre konsertmästare', hierarchyLevel: 2 },
        { name: 'Stämledare violin 2', hierarchyLevel: 3 },
        { name: 'Tutti violin 1', hierarchyLevel: 4 },
        { name: 'Tutti violin 2', hierarchyLevel: 5 }
      ]
    },
    {
      name: 'Viola',
      displayOrder: 2,
      positions: [
        { name: 'Stämledare', hierarchyLevel: 1 },
        { name: 'Alternerande stämledare', hierarchyLevel: 2 },
        { name: 'Tutti', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Cello',
      displayOrder: 3,
      positions: [
        { name: 'Solocellist', hierarchyLevel: 1 },
        { name: 'Alternerande stämledare', hierarchyLevel: 2 },
        { name: 'Tutti', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Kontrabas',
      displayOrder: 4,
      positions: [
        { name: 'Stämledare', hierarchyLevel: 1 },
        { name: 'Tutti', hierarchyLevel: 2 }
      ]
    },
    {
      name: 'Flöjt',
      displayOrder: 5,
      positions: [
        { name: 'Soloflöjt', hierarchyLevel: 1 },
        { name: 'Stämledare flöjt 2', hierarchyLevel: 2 },
        { name: 'Piccolaflöjt', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Oboe',
      displayOrder: 6,
      positions: [
        { name: 'Solooboe', hierarchyLevel: 1 },
        { name: 'Stämledare oboe 2', hierarchyLevel: 2 },
        { name: 'Engelskt horn', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Klarinett',
      displayOrder: 7,
      positions: [
        { name: 'Soloklarinett', hierarchyLevel: 1 },
        { name: 'Stämledare klarinett 2', hierarchyLevel: 2 },
        { name: 'Essklarinett', hierarchyLevel: 3 },
        { name: 'Basklarinett', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Fagott',
      displayOrder: 8,
      positions: [
        { name: 'Solofagott', hierarchyLevel: 1 },
        { name: 'Stämledare fagott 2', hierarchyLevel: 2 },
        { name: 'Kontrafagott', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Valthorn',
      displayOrder: 9,
      positions: [
        { name: 'Solovalthorn', hierarchyLevel: 1 },
        { name: 'Stämledare valthorn 2', hierarchyLevel: 2 },
        { name: 'Valthorn 3', hierarchyLevel: 3 },
        { name: 'Valthorn 4', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Trumpet',
      displayOrder: 10,
      positions: [
        { name: 'Solotrumpet', hierarchyLevel: 1 },
        { name: 'Stämledare trumpet 2', hierarchyLevel: 2 },
        { name: 'Trumpet 3', hierarchyLevel: 3 },
        { name: 'Kornet', hierarchyLevel: 4 }
      ]
    },
    {
      name: 'Trombon',
      displayOrder: 11,
      positions: [
        { name: 'Solotrombon', hierarchyLevel: 1 },
        { name: 'Trombon 2', hierarchyLevel: 2 },
        { name: 'Bastrombon', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Tuba',
      displayOrder: 12,
      positions: [
        { name: 'Solotuba', hierarchyLevel: 1 }
      ]
    },
    {
      name: 'Slagverk',
      displayOrder: 13,
      positions: [
        { name: 'Soloslagverk', hierarchyLevel: 1 },
        { name: 'Slagverk 2', hierarchyLevel: 2 },
        { name: 'Puka', hierarchyLevel: 3 }
      ]
    },
    {
      name: 'Harpa',
      displayOrder: 14,
      positions: [
        { name: 'Soloharpa', hierarchyLevel: 1 },
        { name: 'Harpa 2', hierarchyLevel: 2 }
      ]
    }
  ]

  console.log('Creating instruments and positions...')
  let totalPositions = 0
  let totalRankingLists = 0

  for (const instrumentData of instrumentsData) {
    const instrument = await targetPrisma.instrument.create({
      data: {
        instrumentId: `INST${String(instrumentData.displayOrder).padStart(3, '0')}`,
        name: instrumentData.name,
        displayOrder: instrumentData.displayOrder
      }
    })

    for (const positionData of instrumentData.positions) {
      totalPositions++
      const position = await targetPrisma.position.create({
        data: {
          positionId: `POS${String(totalPositions).padStart(3, '0')}`,
          name: positionData.name,
          hierarchyLevel: positionData.hierarchyLevel,
          instrumentId: instrument.id
        }
      })

      // Create A, B, C ranking lists for each position
      const listTypes = ['A', 'B', 'C'] as const
      for (const listType of listTypes) {
        totalRankingLists++
        await targetPrisma.rankingList.create({
          data: {
            rankingListId: `RANK${String(totalRankingLists).padStart(3, '0')}`,
            listType: listType,
            description: `${listType}-lista för ${position.name} (${instrument.name})`,
            positionId: position.id
          }
        })
      }
    }
  }

  console.log(`Created ${instrumentsData.length} instruments`)
  console.log(`Created ${totalPositions} positions`)
  console.log(`Created ${totalRankingLists} ranking lists`)
}