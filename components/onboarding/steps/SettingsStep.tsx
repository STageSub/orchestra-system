'use client'

import { useState } from 'react'
import { Settings, Mail, Bell, Globe, ArrowRight } from 'lucide-react'

interface SettingsStepProps {
  orchestraName: string
  onNext: () => void
  onSkip: () => void
}

export default function SettingsStep({ orchestraName, onNext, onSkip }: SettingsStepProps) {
  const [settings, setSettings] = useState({
    defaultResponseTime: 48,
    conflictStrategy: 'simple',
    language: 'sv',
    emailNotifications: true
  })

  const handleSaveSettings = async () => {
    try {
      // Save settings to backend
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      alert('Inställningar sparade!')
      onNext()
    } catch (error) {
      console.error('Failed to save settings:', error)
      onNext() // Continue anyway
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Anpassa dina inställningar</h2>
      <p className="text-gray-600 mb-6">
        Konfigurera hur {orchestraName} ska fungera. Du kan alltid ändra dessa senare.
      </p>

      <div className="space-y-6">
        {/* Response Time */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Standard svarstid</h3>
              <p className="text-sm text-gray-600 mb-3">
                Hur lång tid musiker har på sig att svara på förfrågningar
              </p>
              <select
                value={settings.defaultResponseTime}
                onChange={(e) => setSettings({ ...settings, defaultResponseTime: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300"
              >
                <option value={24}>24 timmar</option>
                <option value={48}>48 timmar (rekommenderat)</option>
                <option value={72}>72 timmar</option>
                <option value={168}>1 vecka</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conflict Strategy */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Konflikthantering</h3>
              <p className="text-sm text-gray-600 mb-3">
                Vad ska hända om en musiker redan har ett projekt samma datum?
              </p>
              <select
                value={settings.conflictStrategy}
                onChange={(e) => setSettings({ ...settings, conflictStrategy: e.target.value })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="simple">Enkel - Visa bara varning</option>
                <option value="detailed">Detaljerad - Visa alla konflikter</option>
                <option value="smart">Smart - Analysera och prioritera</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Standardspråk</h3>
              <p className="text-sm text-gray-600 mb-3">
                Vilket språk ska användas för e-postmallar?
              </p>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="sv">Svenska</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">E-postnotifikationer</h3>
              <p className="text-sm text-gray-600 mb-3">
                Få notifikationer när musiker svarar på förfrågningar
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Skicka e-post när musiker svarar</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700"
        >
          Använd standardinställningar
        </button>
        <button
          onClick={handleSaveSettings}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          Spara och fortsätt
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}