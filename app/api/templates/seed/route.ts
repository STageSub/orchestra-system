import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/id-generator'

const defaultTemplates = [
  // Swedish templates
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
  },
  // English templates
  {
    type: 'request_en',
    subject: 'Substitute Request - {{project_name}}',
    body: `Hello {{musician_name}}!

You have received a request to substitute as {{position}} in the production {{project_name}}.

The project starts {{start_date}} and includes {{quantity}} position(s) for {{instrument_name}}.

Rehearsal schedule:
{{rehearsal_schedule}}

Concert information:
{{concert_info}}

Please respond by clicking the link below:
{{response_url}}

You have {{response_time}} hours to respond to this request.

Best regards,
Orchestra Administration`,
    variables: ['musician_name', 'position', 'project_name', 'start_date', 'quantity', 'instrument_name', 'rehearsal_schedule', 'concert_info', 'response_url', 'response_time']
  },
  {
    type: 'reminder_en',
    subject: 'Reminder: Response to substitute request - {{project_name}}',
    body: `Hello {{musician_name}}!

This is a reminder that you have an unanswered request to substitute as {{position}} in {{project_name}}.

Please respond as soon as possible by clicking the link below:
{{response_url}}

Best regards,
Orchestra Administration`,
    variables: ['musician_name', 'position', 'project_name', 'response_url']
  },
  {
    type: 'confirmation_en',
    subject: 'Confirmation: {{project_name}}',
    body: `Hello {{musician_name}}!

Thank you for accepting the assignment as {{position}} in {{project_name}}.

The project starts {{start_date}}.

We will be in touch with more detailed information closer to the start date.

Best regards,
Orchestra Administration`,
    variables: ['musician_name', 'position', 'project_name', 'start_date']
  },
  {
    type: 'position_filled_en',
    subject: 'Position filled - {{project_name}}',
    body: `Hello {{musician_name}}!

Unfortunately, we must inform you that the position as {{position}} in {{project_name}} has now been filled.

We thank you for your interest and hope to contact you for future opportunities.

Best regards,
Orchestra Administration`,
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