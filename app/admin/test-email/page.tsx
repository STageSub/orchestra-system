'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [testType, setTestType] = useState<'simple' | 'request' | 'reminder' | 'confirmation' | 'position_filled'>('simple')

  const handleSendTest = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Vänligen ange en e-postadress' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          type: testType
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: 'E-post skickad! Kontrollera din inkorg.' })
      } else {
        throw new Error(data.error || 'Fel vid utskick')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      setResult({ 
        success: false, 
        message: `Fel vid utskick: ${error instanceof Error ? error.message : 'Okänt fel'}`
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test E-post</h1>
        <p className="mt-2 text-sm text-gray-600">
          Testa e-postfunktionaliteten genom att skicka test-mail till valfri adress.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test-typ
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="simple">Enkel test-mail</option>
              <option value="request">Förfrågningsmall</option>
              <option value="reminder">Påminnelsemall</option>
              <option value="confirmation">Bekräftelsemall</option>
              <option value="position_filled">Position fylld-mall</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mottagare e-post
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Skickar...' : 'Skicka test-mail'}
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• E-post skickas via Resend API</p>
            <p>• I utvecklingsläge simuleras e-post om inte FORCE_REAL_EMAILS=true</p>
            <p>• Kontrollera konsolen för simulerade e-postmeddelanden</p>
            <p>• Mallarna använder testdata med svenska texter</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Aktuell konfiguration</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• NODE_ENV: {process.env.NODE_ENV}</p>
            <p>• FORCE_REAL_EMAILS: {process.env.FORCE_REAL_EMAILS || 'false'}</p>
            <p>• RESEND_API_KEY: {process.env.RESEND_API_KEY ? '✓ Konfigurerad' : '✗ Saknas'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}