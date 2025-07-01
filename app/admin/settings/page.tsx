'use client'

import Link from 'next/link'
import { 
  CreditCard, 
  Mail, 
  Users, 
  Shield, 
  Database,
  ChevronRight,
  Building2,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface Setting {
  id: number
  key: string
  value: string
  description: string | null
}

const settingsSections = [
  {
    title: 'Prenumeration & Fakturering',
    description: 'Hantera din plan, användning och betalningsmetoder',
    icon: CreditCard,
    href: '/admin/settings/subscription',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    title: 'E-postmallar',
    description: 'Anpassa e-postmeddelanden för förfrågningar och bekräftelser',
    icon: Mail,
    href: '/admin/settings/email-templates',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Systeminställningar',
    description: 'Påminnelser, konflikthantering och andra globala inställningar',
    icon: Settings,
    href: '/admin/settings/system',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    isInternal: true
  }
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reminderPercentage, setReminderPercentage] = useState('75')
  const [conflictStrategy, setConflictStrategy] = useState('simple')
  const [showSystemSettings, setShowSystemSettings] = useState(false)

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

  if (showSystemSettings) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowSystemSettings(false)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Tillbaka till inställningar
          </button>
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

  // Main settings page
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inställningar</h1>
        <p className="mt-2 text-gray-600">
          Hantera dina kontoinställningar och systemkonfigurationer
        </p>
      </div>

      <div className="grid gap-4">
        {settingsSections.map((section) => (
          section.isInternal ? (
            <button
              key={section.href}
              onClick={() => setShowSystemSettings(true)}
              className="block group text-left w-full"
            >
              <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className={`${section.bgColor} p-3 rounded-lg mr-4`}>
                      <section.icon className={`w-6 h-6 ${section.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            </button>
          ) : (
            <Link
              key={section.href}
              href={section.href}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className={`${section.bgColor} p-3 rounded-lg mr-4`}>
                      <section.icon className={`w-6 h-6 ${section.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            </Link>
          )
        ))}
      </div>
    </div>
  )
}