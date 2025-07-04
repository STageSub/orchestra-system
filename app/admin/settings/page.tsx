'use client'

import { useState, useEffect } from 'react'

interface Setting {
  id: number
  key: string
  value: string
  description: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reminderPercentage, setReminderPercentage] = useState('75')
  const [conflictStrategy, setConflictStrategy] = useState('simple')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        const reminderSetting = data.find((s: Setting) => s.key === 'reminder_percentage')
        if (reminderSetting) {
          setReminderPercentage(reminderSetting.value)
        }
        
        const conflictSetting = data.find((s: Setting) => s.key === 'ranking_conflict_strategy')
        if (conflictSetting) {
          setConflictStrategy(conflictSetting.value)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_percentage: reminderPercentage,
          ranking_conflict_strategy: conflictStrategy
        })
      })

      if (response.ok) {
        alert('Inställningar sparade')
        fetchSettings()
      } else {
        alert('Kunde inte spara inställningar')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar inställningar...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Systeminställningar</h2>
        <p className="mt-1 text-sm text-gray-500">
          Konfigurera globala inställningar för systemet
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Påminnelseinställningar
            </h3>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700">
                När ska påminnelse skickas?
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Efter</span>
                <input
                  type="number"
                  min="10"
                  max="90"
                  step="5"
                  value={reminderPercentage}
                  onChange={(e) => setReminderPercentage(e.target.value)}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <span className="text-sm text-gray-500">% av svarstiden har gått</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                T.ex. om svarstiden är 48 timmar och påminnelse är satt till 75%, 
                skickas påminnelsen efter 36 timmar.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rankningslistor - Konflikthantering
            </h3>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700">
                Hur ska systemet hantera musiker som finns på flera listor?
              </label>
              <select
                value={conflictStrategy}
                onChange={(e) => setConflictStrategy(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="simple">Enkel (standard)</option>
                <option value="detailed">Detaljerad förhandsvisning</option>
                <option value="smart">Smart position-matchning</option>
              </select>
              
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">
                  {conflictStrategy === 'simple' && (
                    <>
                      <strong>Enkel:</strong> Visar endast varning. Först till kvarn-principen gäller. 
                      Systemet skickar förfrågningar i den ordning de processas. Om en musiker får en förfrågan 
                      för en position, hoppas de automatiskt över för andra positioner.
                    </>
                  )}
                  {conflictStrategy === 'detailed' && (
                    <>
                      <strong>Detaljerad förhandsvisning:</strong> Visar potentiella konflikter och 
                      realtidsinformation när förfrågningar skickas. Som "Enkel" men med utökad information 
                      om potentiella konflikter och realtidsuppdateringar.
                    </>
                  )}
                  {conflictStrategy === 'smart' && (
                    <>
                      <strong>Smart position-matchning:</strong> Prioriterar automatiskt den position där 
                      musikern rankas högst. Om lika ranking, prioritera hierarkiskt högre position.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Framtida inställningar
            </h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Standardmeddelanden och signaturer</li>
              <li>• Automatiska påminnelser (på/av)</li>
              <li>• Standardsvarstider för nya projekt</li>
              <li>• E-postserverinställningar</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </div>
    </div>
  )
}