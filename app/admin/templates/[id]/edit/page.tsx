'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EmailTemplate {
  id: number
  emailTemplateId: string
  type: string
  subject: string
  body: string
  variables: string[]
}

const templateTypeLabels: Record<string, string> = {
  request: 'Förfrågan',
  reminder: 'Påminnelse',
  confirmation: 'Bekräftelse',
  position_filled: 'Position fylld'
}

const availableVariables: Record<string, string[]> = {
  request: ['musicianName', 'projectName', 'position', 'projectDate', 'projectInfo', 'rehearsalSchedule', 'concertInfo', 'responseLink', 'responseTime'],
  reminder: ['musicianName', 'projectName', 'position', 'responseLink'],
  confirmation: ['musicianName', 'projectName', 'position', 'projectDate', 'firstRehearsal'],
  position_filled: ['musicianName', 'projectName', 'position']
}

export default function EditTemplatePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [paramsId, setParamsId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    variables: [] as string[]
  })

  useEffect(() => {
    params.then(p => {
      setParamsId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (paramsId) {
      fetchTemplate()
    }
  }, [paramsId])

  const fetchTemplate = async () => {
    if (!paramsId) return
    
    try {
      const response = await fetch(`/api/templates/${paramsId}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()
      setTemplate(data)
      
      setFormData({
        subject: data.subject,
        body: data.body,
        variables: data.variables || []
      })
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/templates/${paramsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/templates')
      } else {
        const error = await response.json()
        alert(error.error || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Ett fel uppstod vid uppdatering av mall')
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = `${before}{{${variable}}}${after}`
      
      setFormData({ ...formData, body: newText })
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = start + variable.length + 4 // +4 for {{}}
        textarea.selectionEnd = start + variable.length + 4
      }, 0)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar mall...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Mall hittades inte</p>
        <Link
          href="/admin/templates"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Tillbaka till mallar
        </Link>
      </div>
    )
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
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          Redigera {templateTypeLabels[template.type] || template.type}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Uppdatera e-postmall för automatiska utskick
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Ämnesrad
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="t.ex. Förfrågan om vikariat - {{projectName}}"
              />
              <p className="mt-1 text-xs text-gray-500">
                Använd variabler med dubbla klammerparenteser: {`{{variabelnamn}}`}
              </p>
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                Innehåll
              </label>
              <textarea
                id="body"
                rows={15}
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
                placeholder="Skriv din e-postmall här..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tillgängliga variabler
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVariables[template.type]?.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Klicka på en variabel för att infoga den där markören står
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/templates"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </form>
    </div>
  )
}