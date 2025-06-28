'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function RespondContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const presetResponse = searchParams.get('response') as 'accepted' | 'declined' | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestData, setRequestData] = useState<{
    request: {
      id: number
      musician: { firstName: string; lastName: string }
      project: {
        name: string
        startDate: string
        weekNumber: number
        rehearsalSchedule: string | null
        concertInfo: string | null
      }
      position: {
        instrument: string
        name: string
      }
      responseTimeHours: number
    }
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [responseMessage, setResponseMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Ingen token angiven')
      setLoading(false)
      return
    }

    validateToken()
  }, [token])

  // Remove auto-submit - let user click manually


  const validateToken = async () => {
    try {
      console.log('Validating token:', token)
      const response = await fetch(`/api/respond?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Token validation failed:', response.status, data)
        setError(data.error || 'Ogiltig token')
      } else {
        console.log('Token validated successfully:', data)
        setRequestData(data)
      }
    } catch (err) {
      console.error('Error during token validation:', err)
      setError('Ett fel uppstod vid validering av token')
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (response: 'accepted' | 'declined') => {
    console.log('=== RESPOND FRONTEND - handleResponse ===')
    console.log('Response type:', response)
    console.log('Current states:', { submitting, submitted, error })
    
    // Prevent double submission
    if (submitting || submitted) {
      console.log('Already submitting or submitted, ignoring')
      return
    }
    
    setSubmitting(true)
    setError(null)

    try {
      console.log('=== RESPOND FRONTEND - Sending to API ===')
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'missing')
      console.log('Response:', response)
      
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, response })
      })

      console.log('=== RESPOND FRONTEND - API Response ===')
      console.log('Status:', res.status)
      console.log('Status Text:', res.statusText)
      console.log('Headers:', Object.fromEntries(res.headers.entries()))
      
      const text = await res.text()
      console.log('Raw response body:', text)
      
      let data
      try {
        data = text ? JSON.parse(text) : {}
        console.log('Parsed data:', data)
      } catch (e) {
        console.error('=== RESPOND FRONTEND - Parse Error ===')
        console.error('Failed to parse response:', e)
        console.error('Raw text was:', text)
        data = { error: 'Invalid server response' }
      }

      if (!res.ok) {
        console.error('=== RESPOND FRONTEND - API Error ===')
        console.error('Response submission failed')
        console.error('Status:', res.status)
        console.error('Data:', data)
        setError(data.error || 'Ett fel uppstod när vi skulle registrera ditt svar')
      } else {
        console.log('=== RESPOND FRONTEND - Success ===')
        console.log('Response submitted successfully:', data)
        setResponseMessage(data.message || 'Tack för ditt svar!')
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error during response submission:', err)
      setError('Ett fel uppstod när vi skulle registrera ditt svar. Vänligen försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar förfrågan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    // Special handling for already used tokens
    if (error.includes('redan använts') || error.includes('redan svarat')) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Svar redan registrerat</h1>
            <p className="text-gray-600">
              Du har redan svarat på denna förfrågan. Vi har skickat en bekräftelse via e-post.
            </p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fel</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tack för ditt svar!</h1>
          <p className="text-gray-600">
            {responseMessage || 'Vi har registrerat ditt svar.'}
          </p>
        </div>
      </div>
    )
  }

  const { request } = requestData
  const { musician, project, position } = request

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Förfrågan om vikariat</h1>
            <p className="text-blue-100 mt-1">StageSub - Orkestervikarieförfrågningssystem</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Hej {musician.firstName}!
              </h2>
              <p className="text-gray-700">
                Du har fått en förfrågan om att vikariera i följande produktion:
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Projekt</h3>
                <p className="text-gray-700">{project.name}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Position</h3>
                <p className="text-gray-700">
                  {position.name} - {position.instrument}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Startdatum</h3>
                <p className="text-gray-700">
                  {new Date(project.startDate).toLocaleDateString('sv-SE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {' '}(Vecka {project.weekNumber})
                </p>
              </div>

              {project.rehearsalSchedule && (
                <div>
                  <h3 className="font-semibold text-gray-900">Repetitionsschema</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.rehearsalSchedule}</p>
                </div>
              )}

              {project.concertInfo && (
                <div>
                  <h3 className="font-semibold text-gray-900">Konsertinformation</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.concertInfo}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Kan du ta detta uppdrag?</h3>
              <div className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleResponse('accepted')}
                    disabled={submitting}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Skickar...' : 'Ja, jag kan'}
                  </button>
                  <button
                    onClick={() => handleResponse('declined')}
                    disabled={submitting}
                    className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Skickar...' : 'Nej, jag kan inte'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500">
            <p>
              Denna länk är personlig och kan endast användas en gång.
              Kontakta orkesteradministrationen om du har frågor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RespondPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar...</p>
        </div>
      </div>
    }>
      <RespondContent />
    </Suspense>
  )
}