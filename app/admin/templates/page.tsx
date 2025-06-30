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

// Define base template types and their metadata
const baseTemplateTypes = {
  request: {
    label: 'Förfrågan',
    description: 'Skickas när en musiker får en förfrågan om att spela',
    color: 'blue'
  },
  reminder: {
    label: 'Påminnelse',
    description: 'Skickas som påminnelse om obesvarade förfrågningar',
    color: 'yellow'
  },
  confirmation: {
    label: 'Bekräftelse',
    description: 'Skickas när en musiker accepterar en förfrågan',
    color: 'green'
  },
  position_filled: {
    label: 'Position fylld',
    description: 'Skickas när en position har fyllts (först till kvarn)',
    color: 'purple'
  }
}

// Language configurations
const languages = {
  sv: { label: 'Svenska', flag: '🇸🇪' },
  en: { label: 'English', flag: '🇬🇧' }
}

// Group templates by base type
const groupTemplatesByBaseType = (templates: EmailTemplate[]) => {
  const grouped: Record<string, Record<string, EmailTemplate>> = {}
  
  templates.forEach(template => {
    // Extract base type and language
    const match = template.type.match(/^(.+?)(?:_([a-z]{2}))?$/)
    const baseType = match?.[1] || template.type
    const language = match?.[2] || 'sv' // Default to Swedish if no language suffix
    
    if (!grouped[baseType]) {
      grouped[baseType] = {}
    }
    
    grouped[baseType][language] = template
  })
  
  return grouped
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      green: 'bg-green-50 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      green: 'text-green-600',
      purple: 'text-purple-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
  }

  const toggleGroup = (baseType: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(baseType)) {
      newExpanded.delete(baseType)
    } else {
      newExpanded.add(baseType)
    }
    setExpandedGroups(newExpanded)
  }

  const seedMissingTemplates = async () => {
    try {
      const response = await fetch('/api/templates/seed', { method: 'POST' })
      if (response.ok) {
        alert('Saknade mallar har skapats!')
        fetchTemplates()
      } else {
        alert('Kunde inte skapa mallar')
      }
    } catch (error) {
      alert('Ett fel uppstod när mallar skulle skapas')
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
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTemplates}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Försök igen
        </button>
      </div>
    )
  }

  const groupedTemplates = groupTemplatesByBaseType(templates)

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">E-postmallar</h2>
            <p className="mt-1 text-sm text-gray-600">
              Hantera e-postmallar för olika kommunikationstyper och språk
            </p>
          </div>
          <button
            onClick={seedMissingTemplates}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            title="Skapa saknade standardmallar"
          >
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Skapa saknade mallar
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Inga e-postmallar finns ännu</p>
          <button
            onClick={seedMissingTemplates}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Skapa standardmallar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(baseTemplateTypes).map(([baseType, config]) => {
            const templateGroup = groupedTemplates[baseType] || {}
            const isExpanded = expandedGroups.has(baseType)
            const hasTemplates = Object.keys(templateGroup).length > 0
            
            if (!hasTemplates) return null
            
            return (
              <div key={baseType} className={`rounded-lg border-2 overflow-hidden transition-all ${getColorClasses(config.color)}`}>
                <button
                  onClick={() => toggleGroup(baseType)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-opacity-75 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${getIconColorClasses(config.color)}`}>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      {Object.entries(languages).map(([langCode, lang]) => (
                        <span
                          key={langCode}
                          className={`text-sm px-2 py-1 rounded ${
                            templateGroup[langCode] 
                              ? 'bg-white text-gray-700 shadow-sm' 
                              : 'bg-gray-200 text-gray-400'
                          }`}
                          title={templateGroup[langCode] ? `${lang.label} mall finns` : `${lang.label} mall saknas`}
                        >
                          {lang.flag} {lang.label}
                        </span>
                      ))}
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="bg-white border-t-2 border-gray-100">
                    <div className="divide-y divide-gray-100">
                      {Object.entries(languages).map(([langCode, lang]) => {
                        const template = templateGroup[langCode]
                        
                        return (
                          <div key={langCode} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{lang.flag}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{lang.label}</h4>
                                  {template ? (
                                    <p className="text-sm text-gray-600">
                                      Uppdaterad: {formatDate(template.updatedAt)}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-red-600">Mall saknas</p>
                                  )}
                                </div>
                              </div>
                              {template ? (
                                <Link
                                  href={`/admin/templates/${template.id}/edit`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Redigera
                                </Link>
                              ) : (
                                <button
                                  onClick={seedMissingTemplates}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  Skapa mall
                                </button>
                              )}
                            </div>
                            {template && (
                              <div className="mt-3 text-sm text-gray-700">
                                <p className="font-medium">Ämne:</p>
                                <p className="text-gray-600">{template.subject}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {templates.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips</h3>
              <p className="mt-1 text-sm text-blue-700">
                E-postmallar grupperas efter typ och visar tillgängliga språkvarianter. 
                Klicka på en malltyp för att se och redigera språkspecifika versioner.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}