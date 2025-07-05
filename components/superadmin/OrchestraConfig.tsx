'use client'

import { useState, useEffect } from 'react'
import { Mail, Key, Globe, Webhook, Save, TestTube, Eye, EyeOff } from 'lucide-react'

interface OrchestraConfigProps {
  orchestraId: string
  orchestraName: string
}

interface ConfigData {
  // Email Configuration
  resendApiKey?: string | null
  emailFromAddress?: string | null
  emailFromName?: string | null
  emailReplyTo?: string | null
  // Feature Toggles
  features?: any
  // Branding
  primaryColor?: string | null
  secondaryColor?: string | null
  customDomain?: string | null
  faviconUrl?: string | null
  // API & Integrations
  apiKey?: string | null
  webhookUrl?: string | null
  webhookSecret?: string | null
}

export default function OrchestraConfig({ orchestraId, orchestraName }: OrchestraConfigProps) {
  const [config, setConfig] = useState<ConfigData>({})
  const [originalConfig, setOriginalConfig] = useState<ConfigData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [orchestraId])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/superadmin/orchestras/${orchestraId}/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setOriginalConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/superadmin/orchestras/${orchestraId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        alert('Konfiguration sparad!')
        fetchConfig() // Refresh to get updated data
      } else {
        const error = await response.json()
        alert(`Fel: ${error.error}`)
      }
    } catch (error) {
      alert('Ett fel uppstod vid sparande')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Ange en e-postadress att testa med')
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch(`/api/superadmin/orchestras/${orchestraId}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Test-email skickat till ${testEmail}!`)
      } else {
        alert(`Fel: ${data.error}\n${data.details || ''}\n${data.hint || ''}`)
      }
    } catch (error) {
      alert('Ett fel uppstod vid testning')
    } finally {
      setIsTesting(false)
    }
  }

  const generateApiKey = () => {
    if (confirm('Vill du generera en ny API-nyckel? Den gamla nyckeln kommer sluta fungera.')) {
      setConfig({ ...config, apiKey: 'generate' })
    }
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

  if (isLoading) {
    return <div className="p-6">Laddar konfiguration...</div>
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Konfiguration för {orchestraName}</h2>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sparar...' : 'Spara ändringar'}
        </button>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">E-postkonfiguration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resend API-nyckel
            </label>
            <input
              type="password"
              value={config.resendApiKey || ''}
              onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="re_..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Lämna tom för att använda standard
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Från-adress
            </label>
            <input
              type="email"
              value={config.emailFromAddress || ''}
              onChange={(e) => setConfig({ ...config, emailFromAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="no-reply@stagesub.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Från-namn
            </label>
            <input
              type="text"
              value={config.emailFromName || ''}
              onChange={(e) => setConfig({ ...config, emailFromName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={orchestraName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Svara-till adress
            </label>
            <input
              type="email"
              value={config.emailReplyTo || ''}
              onChange={(e) => setConfig({ ...config, emailReplyTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="admin@orchestra.se"
            />
          </div>
        </div>

        {/* Test Email */}
        <div className="mt-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Testa e-postkonfiguration
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="test@exempel.se"
            />
            <button
              onClick={handleTestEmail}
              disabled={isTesting || !config.resendApiKey}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4" />
              {isTesting ? 'Skickar...' : 'Testa'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Funktioner</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { key: 'enableGroupEmail', label: 'Gruppmail', desc: 'Skicka mail till accepterade musiker' },
            { key: 'enableFileSharing', label: 'Fildelning', desc: 'Ladda upp och dela filer med musiker' },
            { key: 'enableCustomBranding', label: 'Anpassad branding', desc: 'Egna färger och logotyp' },
            { key: 'enableApiAccess', label: 'API-åtkomst', desc: 'Programmatisk åtkomst via API' },
            { key: 'enableWebhooks', label: 'Webhooks', desc: 'Ta emot händelser via webhooks' },
          ].map(feature => (
            <label key={feature.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.features?.[feature.key] ?? false}
                onChange={(e) => setConfig({
                  ...config,
                  features: {
                    ...config.features,
                    [feature.key]: e.target.checked
                  }
                })}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">{feature.label}</div>
                <div className="text-xs text-gray-500">{feature.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* API & Integrations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">API & Integrationer</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API-nyckel
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border rounded-md"
                  placeholder="Ingen nyckel genererad"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={generateApiKey}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                Generera ny
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={config.webhookUrl || ''}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://api.exempel.se/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Secret
            </label>
            <input
              type="password"
              value={config.webhookSecret || ''}
              onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="whsec_..."
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Varumärke</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primärfärg
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.primaryColor || '#3B82F6'}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                className="h-10 w-20"
              />
              <input
                type="text"
                value={config.primaryColor || '#3B82F6'}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sekundärfärg
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.secondaryColor || '#1E40AF'}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                className="h-10 w-20"
              />
              <input
                type="text"
                value={config.secondaryColor || '#1E40AF'}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anpassad domän
            </label>
            <input
              type="text"
              value={config.customDomain || ''}
              onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="vikarier.orchestra.se"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Favicon URL
            </label>
            <input
              type="url"
              value={config.faviconUrl || ''}
              onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://exempel.se/favicon.ico"
            />
          </div>
        </div>
      </div>
    </div>
  )
}