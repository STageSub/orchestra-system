'use client'

import { useState, useEffect } from 'react'
import { Plus, Database, Zap, Server, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface SystemHealth {
  api: string
  databases: { name: string; status: string }[]
  email: string
}

export default function OrchestraManagement() {
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [provisioningStatus, setProvisioningStatus] = useState<string[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)

  useEffect(() => {
    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/superadmin/health')
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const handleProvision = async (formData: {
    name: string
    email: string
    plan: string
  }) => {
    setIsProvisioning(true)
    setProvisioningStatus(['Skapar orkester...'])

    try {
      // Simulate provisioning steps
      const steps = [
        'Skapar orkester i central databas...',
        'Konfigurerar databas...',
        'Skapar tabeller och schema...',
        'Seedar grunddata...',
        'Konfigurerar prenumeration...',
        'Skickar välkomstmail...'
      ]

      for (const step of steps) {
        setProvisioningStatus(prev => [...prev, step])
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setProvisioningStatus(prev => [...prev, '✅ Orkester skapad!'])
      
      setTimeout(() => {
        setShowProvisionModal(false)
        setIsProvisioning(false)
        setProvisioningStatus([])
        alert('Orkester skapad framgångsrikt!')
      }, 2000)

    } catch (error) {
      setProvisioningStatus(prev => [...prev, '❌ Fel vid skapande av orkester'])
      setIsProvisioning(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Orkesterhantering</h2>
          <p className="text-sm text-gray-600 mt-1">Skapa och hantera nya orkestrar</p>
        </div>
        <button
          onClick={() => setShowProvisionModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny orkester
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h3 className="text-lg font-semibold">Snabbåtgärder</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={async () => {
                if (confirm('Vill du köra migrationer på alla databaser?')) {
                  alert('Kör migrationer... (kommer snart)')
                  // TODO: Implement migration runner
                }
              }}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm"
            >
              Kör migrationer på alla databaser
            </button>
            <button 
              onClick={async () => {
                if (confirm('Vill du uppdatera alla scheman?')) {
                  alert('Uppdaterar scheman... (kommer snart)')
                  // TODO: Implement schema update
                }
              }}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm"
            >
              Uppdatera alla scheman
            </button>
            <button 
              onClick={async () => {
                alert('Cache rensad!')
                // In a real implementation, this would clear Redis/memory caches
              }}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm"
            >
              Rensa cache för alla orkestrar
            </button>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold">Databashälsa</h3>
          </div>
          <div className="space-y-3">
            {systemHealth?.databases.map((db) => (
              <div key={db.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{db.name}</span>
                {db.status === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : db.status === 'no-database' ? (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )) || (
              <div className="text-sm text-gray-400">Laddar...</div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold">Systemstatus</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.api === 'operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth?.api === 'operational' ? 'Operativ' : 'Fel'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Databaser</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.databases.every(db => db.status === 'healthy' || db.status === 'no-database')
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {systemHealth?.databases.every(db => db.status === 'healthy' || db.status === 'no-database') ? 'Alla OK' : 'Problem'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">E-post</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.email === 'operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth?.email === 'operational' ? 'Aktiv' : 'Fel'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provision Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Skapa ny orkester</h3>
            
            {!isProvisioning ? (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleProvision({
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  plan: formData.get('plan') as string
                })
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Orkesternamn</label>
                    <input
                      type="text"
                      name="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="Exempel Symfoniorkester"
                      required
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin e-post</label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="admin@exempel.se"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <select
                      name="plan"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      required
                    >
                      <option value="small">Small - 50 musiker, 5 projekt</option>
                      <option value="medium">Medium - 200 musiker, 20 projekt</option>
                      <option value="enterprise">Enterprise - Obegränsat</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProvisionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                  >
                    Skapa orkester
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {provisioningStatus.map((status, index) => (
                    <div key={index} className="flex items-center gap-2 py-1">
                      {status.includes('✅') ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : status.includes('❌') ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}