'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const defaultTemplates = [
  {
    type: 'request',
    subject: 'Förfrågan om vikariat - {{projectName}}',
    body: `Hej {{musicianName}},

Vi söker en vikarie för positionen {{position}} till vårt projekt "{{projectName}}" som äger rum {{projectDate}}.

**Projektdetaljer:**
{{projectInfo}}

**Repetitionsschema:**
{{rehearsalSchedule}}

**Konsertinformation:**
{{concertInfo}}

Vänligen svara genom att klicka på länken nedan:
{{responseLink}}

Svar önskas senast inom 24 timmar.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musicianName', 'projectName', 'position', 'projectDate', 'projectInfo', 'rehearsalSchedule', 'concertInfo', 'responseLink']
  },
  {
    type: 'reminder',
    subject: 'Påminnelse: Svar önskas - {{projectName}}',
    body: `Hej {{musicianName}},

Detta är en påminnelse om vår tidigare förfrågan angående vikariat för {{position}} i projektet "{{projectName}}".

Vi har ännu inte mottagit ditt svar och skulle uppskatta om du kunde meddela oss snarast möjligt.

Klicka här för att svara: {{responseLink}}

Om du inte är intresserad, vänligen meddela oss det också så vi kan gå vidare med andra kandidater.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musicianName', 'projectName', 'position', 'responseLink']
  },
  {
    type: 'confirmation',
    subject: 'Bekräftelse - {{projectName}}',
    body: `Hej {{musicianName}},

Tack för att du tackat ja till att vikariera som {{position}} i projektet "{{projectName}}"!

Vi ser fram emot att ha dig med oss.

**Startdatum:**
{{projectDate}}

**Första repetition:**
{{firstRehearsal}}

Noter och ytterligare information kommer att skickas separat.

Om du har några frågor, tveka inte att kontakta oss.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musicianName', 'projectName', 'position', 'projectDate', 'firstRehearsal']
  },
  {
    type: 'position_filled',
    subject: 'Position fylld - {{projectName}}',
    body: `Hej {{musicianName}},

Tack för ditt intresse för att vikariera som {{position}} i projektet "{{projectName}}".

Vi vill informera dig om att positionen nu är fylld.

Vi hoppas få möjlighet att arbeta med dig i framtida projekt.

Med vänliga hälsningar,
Orkesteradministrationen`,
    variables: ['musicianName', 'projectName', 'position']
  }
]

export default function SeedTemplatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSeedTemplates = async () => {
    setLoading(true)
    
    try {
      for (const template of defaultTemplates) {
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        })
        
        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to create template:', error)
        }
      }
      
      alert('Standardmallar har lagts till!')
      router.push('/admin/templates')
    } catch (error) {
      console.error('Error seeding templates:', error)
      alert('Ett fel uppstod vid skapande av mallar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/templates"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till e-postmallar
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Lägg in standardmallar</h2>
        <p className="mt-1 text-sm text-gray-600">
          Detta kommer skapa fyra standardmallar för e-postkommunikation
        </p>
      </div>

      <div className="space-y-6">
        {defaultTemplates.map((template) => (
          <div key={template.type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {template.type === 'request' && 'Förfrågan'}
              {template.type === 'reminder' && 'Påminnelse'}
              {template.type === 'confirmation' && 'Bekräftelse'}
              {template.type === 'position_filled' && 'Position fylld'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ämne</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{template.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Innehåll</label>
                <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded whitespace-pre-wrap font-sans">
                  {template.body}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Variabler</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <span key={variable} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <Link
          href="/admin/templates"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Avbryt
        </Link>
        <button
          onClick={handleSeedTemplates}
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Skapar mallar...' : 'Lägg till alla mallar'}
        </button>
      </div>
    </div>
  )
}