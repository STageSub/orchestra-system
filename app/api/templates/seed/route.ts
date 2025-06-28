import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'

const defaultTemplates = [
  {
    type: 'request',
    subject: 'Förfrågan om vikariat - {{project_name}}',
    body: `Hej {{musician_name}}!

Du har fått en förfrågan om att vikariera som {{position}} i produktionen {{project_name}}.

Projektet startar {{start_date}} och inkluderar {{quantity}} position(er) för {{instrument_name}}.

Repetitionsschema:
{{rehearsal_schedule}}

Konsertinformation:
{{concert_info}}

Vänligen svara genom att klicka på länken nedan:
{{response_url}}

Du har {{response_time}} timmar på dig att svara på denna förfrågan.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musician_name', 'position', 'project_name', 'start_date', 'quantity', 'instrument_name', 'rehearsal_schedule', 'concert_info', 'response_url', 'response_time']
  },
  {
    type: 'reminder',
    subject: 'Påminnelse: Svar på vikarieförfrågan - {{project_name}}',
    body: `Hej {{musician_name}}!

Detta är en påminnelse om att du har en obesvarad förfrågan om att vikariera som {{position}} i {{project_name}}.

Vänligen svara snarast genom att klicka på länken nedan:
{{response_url}}

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musician_name', 'position', 'project_name', 'response_url']
  },
  {
    type: 'confirmation',
    subject: 'Bekräftelse: {{project_name}}',
    body: `Hej {{musician_name}}!

Tack för att du accepterade uppdraget som {{position}} i {{project_name}}.

Projektet startar {{start_date}}.

Vi återkommer med mer detaljerad information närmare startdatum.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musician_name', 'position', 'project_name', 'start_date']
  },
  {
    type: 'position_filled',
    subject: 'Position fylld - {{project_name}}',
    body: `Hej {{musician_name}}!

Tyvärr måste vi meddela att positionen som {{position}} i {{project_name}} nu är fylld.

Vi tackar för ditt intresse och hoppas få återkomma vid framtida tillfällen.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musician_name', 'position', 'project_name']
  }
]

export async function POST() {
  try {
    // Check if templates already exist
    const existingCount = await prisma.emailTemplate.count()
    
    if (existingCount > 0) {
      return NextResponse.json(
        { error: 'Email templates already exist' },
        { status: 400 }
      )
    }

    // Create templates
    for (const template of defaultTemplates) {
      const templateId = await generateUniqueId('template')
      
      await prisma.emailTemplate.create({
        data: {
          emailTemplateId: templateId,
          type: template.type,
          subject: template.subject,
          body: template.body,
          variables: template.variables
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `${defaultTemplates.length} email templates created`
    })
  } catch (error) {
    console.error('Error seeding templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed email templates' },
      { status: 500 }
    )
  }
}