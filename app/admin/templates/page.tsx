'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EmailTemplate {
  id: number
  emailTemplateId: string
  type: string
  subject: string
  body: string
  variables: any
  createdAt: string
  updatedAt: string
}

const templateTypeLabels: Record<string, string> = {
  request: 'Förfrågan',
  reminder: 'Påminnelse',
  confirmation: 'Bekräftelse',
  position_filled: 'Position fylld'
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch templates:', response.status, errorText)
        setError(`Kunde inte hämta mallar: ${response.status}`)
        setTemplates([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setTemplates(data)
        setError(null)
      } else {
        console.error('Templates data is not an array:', data)
        setError('Ogiltig data från servern')
        setTemplates([])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      setError('Kunde inte ansluta till servern')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-100 text-blue-800'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmation':
        return 'bg-green-100 text-green-800'
      case 'position_filled':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar e-postmallar...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchTemplates()
          }}
          className="mt-4 text-sm text-blue-600 hover:text-blue-500"
        >
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">E-postmallar</h2>
            <p className="mt-1 text-sm text-gray-600">
              Hantera mallar för automatiska e-postutskick
            </p>
          </div>
          {templates.length === 0 && (
            <Link
              href="/admin/templates/seed"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Lägg in standardmallar
            </Link>
          )}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            Inga e-postmallar finns ännu
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Klicka på &quot;Lägg in standardmallar&quot; för att komma igång
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ämne
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uppdaterad
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                        {templateTypeLabels[template.type] || template.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900">{template.subject}</div>
                      <div className="text-xs text-gray-500">
                        {template.variables?.length || 0} variabler
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(template.updatedAt)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/templates/${template.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Redigera
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}