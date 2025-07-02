'use client'

import { useState } from 'react'
import { Calendar, Users, ArrowRight } from 'lucide-react'

interface CreateProjectStepProps {
  orchestraName: string
  onNext: () => void
  onSkip: () => void
}

export default function CreateProjectStep({ onNext, onSkip }: CreateProjectStepProps) {
  const [projectCreated, setProjectCreated] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    rehearsalSchedule: '',
    concertInfo: ''
  })

  const handleCreateProject = async () => {
    if (!formData.name || !formData.startDate) {
      alert('Vänligen fyll i projektnamn och startdatum')
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setProjectCreated(true)
        alert('Projekt skapat!')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Kunde inte skapa projekt')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Skapa ditt första projekt</h2>
      <p className="text-gray-600 mb-6">
        Projekt är grunden för att organisera musiker. Låt oss skapa ett exempel-projekt.
      </p>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projektnamn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300"
              placeholder="Vårkonsert 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Startdatum *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full rounded-md border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repetitionsschema
            </label>
            <textarea
              value={formData.rehearsalSchedule}
              onChange={(e) => setFormData({ ...formData, rehearsalSchedule: e.target.value })}
              className="w-full rounded-md border-gray-300"
              rows={3}
              placeholder="Måndag 18:00-21:00&#10;Onsdag 18:00-21:00&#10;Generalrepetition: Fredag 10:00-13:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konsertinformation
            </label>
            <textarea
              value={formData.concertInfo}
              onChange={(e) => setFormData({ ...formData, concertInfo: e.target.value })}
              className="w-full rounded-md border-gray-300"
              rows={2}
              placeholder="Konserthuset, Stora salen&#10;Lördag 19:00"
            />
          </div>

          <button
            onClick={handleCreateProject}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
            disabled={projectCreated}
          >
            {projectCreated ? '✓ Projekt skapat' : 'Skapa projekt'}
          </button>
        </div>

        {projectCreated && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Bra jobbat!</h4>
            <p className="text-sm text-green-700">
              Nu kan du lägga till musikerbehov till ditt projekt och börja skicka förfrågningar.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Nästa steg: Definiera behov
        </h4>
        <p className="text-sm text-blue-800">
          Efter onboarding kan du lägga till specifika musikerbehov till ditt projekt 
          (t.ex. "2 violinister", "1 cellist") och använda våra smarta förfrågningsstrategier.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700"
        >
          Hoppa över detta steg
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          Fortsätt
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}