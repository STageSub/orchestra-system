import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { getPrisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { getSupabaseManagement } from '@/lib/supabase-management'
import { hashPassword } from '@/lib/auth-db'

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
  const prisma = await getPrismaForUser(request)
    const { subdomain, orchestraName } = await request.json()

    if (!subdomain || !orchestraName) {
      return NextResponse.json(
        { error: 'Subdomain och orkesternamn krävs' },
        { status: 400 }
      )
    }

    // Get the orchestra record
    const orchestra = await prisma.orchestra.findUnique({
      where: { subdomain }
    })

    if (!orchestra) {
      return NextResponse.json(
        { error: 'Orkester hittades inte' },
        { status: 404 }
      )
    }

    // Check if we should use automatic provisioning or pool
    const useAutomaticProvisioning = process.env.SUPABASE_MANAGEMENT_TOKEN && process.env.SUPABASE_ORGANIZATION_ID

    let databaseUrl: string
    let directUrl: string | undefined

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
      } catch (error) {
        console.error('Failed to create Supabase project:', error)
        return NextResponse.json(
          { error: 'Kunde inte skapa databas automatiskt. Kontrollera Supabase-konfigurationen.' },
          { status: 500 }
        )
      }
    } else {
      // Fall back to pool-based approach
      const poolDatabases = [
        process.env.DATABASE_URL_POOL_1,
        process.env.DATABASE_URL_POOL_2,
      ].filter(Boolean)

      if (poolDatabases.length === 0) {
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
        return NextResponse.json(
          { error: 'Alla poolade databaser är redan tilldelade' },
          { status: 503 }
        )
      }

      databaseUrl = availableDb
    }

    // Update the orchestra record with the assigned database
    await prisma.orchestra.update({
      where: { subdomain },
      data: { 
        databaseUrl: databaseUrl,
        status: 'active'
      }
    })

    // Update environment variable dynamically
    process.env[`DATABASE_URL_${subdomain.toUpperCase()}`] = databaseUrl

    // If we have a direct URL, we need to run migrations first
    if (directUrl) {
      console.log('Running migrations on new database...')
      // Note: In Edge Runtime, we can't run migrations directly
      // This would need to be done via a separate Node.js process or API
      console.log('Migrations need to be run separately in a Node.js environment')
    }

    // Create a new Prisma client for the target database
    const targetPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })

    try {
      // Seed initial data
      console.log('Seeding initial data for', orchestraName)

      // Create default email templates
      const emailTemplates = [
        {
          id: 'template-request-sv',
          type: 'request',
          name: 'Förfrågan',
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
          name: 'Påminnelse',
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
          name: 'Bekräftelse',
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
          name: 'Tjänst tillsatt',
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
          data: template
        })
      }

      // Create English email templates
      const englishTemplates = [
        {
          id: 'template-request-en',
          type: 'request_en',
          name: 'Request',
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
          name: 'Reminder',
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
          name: 'Confirmation',
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
          name: 'Position Filled',
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
          data: template
        })
      }

      // Create instruments with positions
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
            id: `INST${String(instrumentData.displayOrder).padStart(3, '0')}`,
            name: instrumentData.name,
            displayOrder: instrumentData.displayOrder
          }
        })

        for (const positionData of instrumentData.positions) {
          totalPositions++
          const position = await targetPrisma.position.create({
            data: {
              id: `POS${String(totalPositions).padStart(3, '0')}`,
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
                id: `RANK${String(totalRankingLists).padStart(3, '0')}`,
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

      // Generate secure password for admin user
      const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
        let password = ''
        for (let i = 0; i < 16; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      }

      const adminPassword = generatePassword()
      const adminUsername = `${subdomain}-admin`

      // Create admin user in the superadmin database
      const adminUser = await prisma.user.create({
        data: {
          username: adminUsername,
          email: orchestra.contactEmail,
          passwordHash: await hashPassword(adminPassword),
          role: 'admin',
          orchestraId: orchestra.id,
          active: true
        }
      })

      console.log(`Created admin user: ${adminUsername}`)
      console.log('Database seeded successfully!')

      await targetPrisma.$disconnect()

      return NextResponse.json({
        success: true,
        message: useAutomaticProvisioning 
          ? 'Ny databas skapad automatiskt och konfigurerad!' 
          : 'Databas provisionerad från pool och konfigurerad!',
        databaseUrl: databaseUrl,
        subdomain,
        requiresMigration: !!directUrl,
        adminCredentials: {
          username: adminUsername,
          password: adminPassword,
          email: orchestra.contactEmail
        }
      })
    } catch (seedError) {
      console.error('Failed to seed database:', seedError)
      await targetPrisma.$disconnect()
      
      // Rollback the assignment
      await prisma.orchestra.update({
        where: { subdomain },
        data: { 
          databaseUrl: null,
          status: 'pending'
        }
      })

      throw seedError
    }
  } catch (error) {
    console.error('Failed to provision database:', error)
    return NextResponse.json(
      { error: 'Kunde inte provisionera databas' },
      { status: 500 }
    )
  }
}