'use client'

import { useState } from 'react'
import { Settings, Mail, Shield, Database, CreditCard, Globe, Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Email Settings
    emailProvider: 'resend',
    fromEmail: 'no-reply@stagesub.com',
    fromName: 'StageSub',
    
    // Security Settings
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    
    // System Settings
    maintenanceMode: false,
    allowNewSignups: true,
    defaultTrialDays: 30,
    
    // Payment Settings
    stripeWebhookEndpoint: '',
    currency: 'SEK',
    taxRate: 25,
    
    // Regional Settings
    defaultLanguage: 'sv',
    defaultTimezone: 'Europe/Stockholm'
  })

  const [isSaving, setIsSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  const handleSave = async (section: string) => {
    setIsSaving(true)
    try {
      await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, settings })
      })
      setSavedSection(section)
      setTimeout(() => setSavedSection(null), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Systeminställningar</h1>
        <p className="mt-2 text-gray-600">
          Hantera globala inställningar för hela StageSub-plattformen
        </p>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">E-postinställningar</h2>
          </div>
          <button
            onClick={() => handleSave('email')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            {savedSection === 'email' ? 'Sparat!' : 'Spara'}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-postleverantör</label>
            <select 
              value={settings.emailProvider}
              onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Från-adress</label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Från-namn</label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Säkerhetsinställningar</h2>
          </div>
          <button
            onClick={() => handleSave('security')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            {savedSection === 'security' ? 'Sparat!' : 'Spara'}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Session timeout (timmar)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max inloggningsförsök</label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Kräv e-postverifiering för nya användare</span>
            </label>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Systeminställningar</h2>
          </div>
          <button
            onClick={() => handleSave('system')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            {savedSection === 'system' ? 'Sparat!' : 'Spara'}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Underhållsläge (blockerar alla användare utom superadmins)</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowNewSignups}
                onChange={(e) => setSettings({ ...settings, allowNewSignups: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Tillåt nya registreringar</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Standard prövotid (dagar)</label>
            <input
              type="number"
              value={settings.defaultTrialDays}
              onChange={(e) => setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value) })}
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Regionala inställningar</h2>
          </div>
          <button
            onClick={() => handleSave('regional')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            {savedSection === 'regional' ? 'Sparat!' : 'Spara'}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Standardspråk</label>
              <select 
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="sv">Svenska</option>
                <option value="en">English</option>
                <option value="no">Norsk</option>
                <option value="fi">Suomi</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Standard tidszon</label>
              <select 
                value={settings.defaultTimezone}
                onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Europe/Stockholm">Stockholm</option>
                <option value="Europe/Oslo">Oslo</option>
                <option value="Europe/Copenhagen">Köpenhamn</option>
                <option value="Europe/Helsinki">Helsingfors</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}