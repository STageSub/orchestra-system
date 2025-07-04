'use client'

import { useState } from 'react'
import { Plus, Database, Zap, Server, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function OrchestraManagement() {
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [provisioningStatus, setProvisioningStatus] = useState<string[]>([])

  const handleProvision = async (formData: {
    name: string
    subdomain: string
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
            <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm">
              Kör migrationer på alla databaser
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm">
              Uppdatera alla scheman
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm">
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Göteborg</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Stockholm</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Malmö</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
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
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Operativ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Databaser</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Alla OK</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">E-post</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Aktiv</span>
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
                  subdomain: formData.get('subdomain') as string,
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
                    <label className="block text-sm font-medium text-gray-700">Subdomän</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="subdomain"
                        className="flex-1 rounded-none rounded-l-md border-gray-300"
                        placeholder="exempel"
                        pattern="[a-z0-9-]+"
                        required
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        .stagesub.com
                      </span>
                    </div>
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