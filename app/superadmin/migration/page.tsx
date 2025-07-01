'use client'

import { useState } from 'react'
import { 
  Database, 
  Upload, 
  Download, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileJson,
  Users,
  Music,
  FileText
} from 'lucide-react'

interface MigrationStatus {
  inProgress: boolean
  currentStep: string
  progress: number
  logs: string[]
}

export default function MigrationToolsPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'migrate'>('import')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [selectedTenant, setSelectedTenant] = useState('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !selectedTenant) return

    setMigrationStatus({
      inProgress: true,
      currentStep: 'Laddar upp fil...',
      progress: 0,
      logs: []
    })

    // Simulate import process
    const steps = [
      'Validerar data...',
      'Importerar musiker...',
      'Importerar instrument...',
      'Importerar projekt...',
      'Slutför import...'
    ]

    for (let i = 0; i < steps.length; i++) {
      setMigrationStatus(prev => ({
        ...prev!,
        currentStep: steps[i],
        progress: ((i + 1) / steps.length) * 100,
        logs: [...prev!.logs, `✓ ${steps[i]}`]
      }))
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setMigrationStatus(prev => ({
      ...prev!,
      inProgress: false,
      currentStep: 'Import slutförd!',
      progress: 100
    }))
  }

  const handleExport = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tenant-${tenantId}-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export misslyckades')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Migreringsverktyg</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Importera Data
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Exportera Data
          </button>
          <button
            onClick={() => setActiveTab('migrate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'migrate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Databas Migration
          </button>
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Importera Data</h2>
          
          <div className="space-y-6">
            {/* Tenant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Välj Tenant
              </label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Välj tenant...</option>
                <option value="tenant-1">Default Orchestra</option>
                <option value="tenant-2">Gothenburg Symphony</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Välj fil att importera
              </label>
              <div className="mt-1 flex items-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span className="px-4 py-2 border rounded-md inline-block">
                    Välj fil
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                  />
                </label>
                {selectedFile && (
                  <span className="ml-3 text-sm text-gray-600">
                    {selectedFile.name}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Stödjer JSON och CSV format. Max 50MB.
              </p>
            </div>

            {/* Import Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Import alternativ</h3>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">Importera musiker</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">Importera instrument & positioner</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">Importera projekt</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Skriv över befintlig data</span>
              </label>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!selectedFile || !selectedTenant || migrationStatus?.inProgress}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {migrationStatus?.inProgress ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importerar...
                </span>
              ) : (
                'Starta Import'
              )}
            </button>
          </div>

          {/* Progress Display */}
          {migrationStatus && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Import Status</h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${migrationStatus.progress}%` }}
                />
              </div>

              {/* Current Step */}
              <p className="text-sm text-gray-600 mb-3">
                {migrationStatus.currentStep}
              </p>

              {/* Logs */}
              <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                {migrationStatus.logs.map((log, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportera Data</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Exportera all data för en tenant till JSON eller CSV format.
            </p>

            {/* Tenant List for Export */}
            <div className="space-y-3">
              {[
                { id: 'tenant-1', name: 'Default Orchestra', musicians: 45, projects: 12 },
                { id: 'tenant-2', name: 'Gothenburg Symphony', musicians: 120, projects: 34 }
              ].map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-sm text-gray-500">
                      {tenant.musicians} musiker • {tenant.projects} projekt
                    </p>
                  </div>
                  <button
                    onClick={() => handleExport(tenant.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportera
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Database Migration Tab */}
      {activeTab === 'migrate' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Databas Migration</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Varning</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Databas migration är en avancerad operation. Se till att ha backup innan du fortsätter.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Migration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-gray-400" />
                  Delad till Dedikerad
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Migrera en tenant från delad databas till egen dedikerad databas.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Starta Migration
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  Single-tenant till Multi-tenant
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Migrera en befintlig single-tenant installation till multi-tenant.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Starta Migration
                </button>
              </div>
            </div>

            {/* Migration Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">Slutförda migrationer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Pågående migrationer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-500">Lyckade migrationer</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}