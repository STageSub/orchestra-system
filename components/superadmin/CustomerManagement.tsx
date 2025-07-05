'use client'

import { useState, useEffect } from 'react'
import { Database, Users, Activity, Edit2, Eye, Pause, Play } from 'lucide-react'

interface Orchestra {
  id: string
  orchestraId: string
  name: string
  subdomain: string
  status: string
  createdAt: string
  subscription?: {
    plan: string
    status: string
    pricePerMonth: number
    maxMusicians: number
    maxProjects: number
  }
  metrics?: {
    totalMusicians: number
    activeMusicians: number
    totalProjects: number
    activeProjects: number
  }[]
}

export default function CustomerManagement() {
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrchestra, setSelectedOrchestra] = useState<Orchestra | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchOrchestras()
  }, [])

  const fetchOrchestras = async () => {
    try {
      const response = await fetch('/api/superadmin/metrics')
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      if (response.ok) {
        const data = await response.json()
        setOrchestras(data.orchestras || [])
      }
    } catch (error) {
      console.error('Failed to fetch orchestras:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusToggle = async (orchestraId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    
    try {
      const response = await fetch(`/api/superadmin/orchestras/${orchestraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        alert(`Status ändrad till ${newStatus}`)
        fetchOrchestras() // Refresh the list
      } else {
        alert('Kunde inte ändra status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Ett fel uppstod')
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'small': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'Enterprise'
      case 'medium': return 'Medium'
      case 'small': return 'Small'
      default: return plan
    }
  }

  if (isLoading) {
    return <div className="p-8">Laddar orkestrar...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Kundhantering</h2>
        <p className="text-sm text-gray-600 mt-1">Hantera orkestrar och deras prenumerationer</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orkester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Användning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Månadsavgift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orchestras.map((orchestra) => {
                const latestMetrics = orchestra.metrics?.[0]
                return (
                  <tr key={orchestra.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Database className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {orchestra.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {orchestra.orchestraId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{orchestra.orchestraId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {orchestra.subscription && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(orchestra.subscription.plan)}`}>
                          {getPlanName(orchestra.subscription.plan)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{latestMetrics?.totalMusicians || 0}/{orchestra.subscription?.maxMusicians || '∞'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span>{latestMetrics?.totalProjects || 0}/{orchestra.subscription?.maxProjects || '∞'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {orchestra.subscription && (
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('sv-SE', { 
                            style: 'currency', 
                            currency: 'SEK' 
                          }).format(orchestra.subscription.pricePerMonth)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        orchestra.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {orchestra.status === 'active' ? 'Aktiv' : 'Pausad'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/admin?orchestra=${orchestra.orchestraId}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Öppna orchestra admin"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrchestra(orchestra)
                            setShowEditModal(true)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Redigera"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(orchestra.id, orchestra.status)}
                          className={orchestra.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                          title={orchestra.status === 'active' ? 'Pausa' : 'Aktivera'}
                        >
                          {orchestra.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && selectedOrchestra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Redigera {selectedOrchestra.name}</h3>
            
            <form id="edit-orchestra-form" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Namn</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedOrchestra.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <select 
                  name="plan"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  defaultValue={selectedOrchestra.subscription?.plan}
                >
                  <option value="small">Small - 4990 SEK</option>
                  <option value="medium">Medium - 9990 SEK</option>
                  <option value="enterprise">Enterprise - 15000 SEK</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max musiker</label>
                  <input
                    type="number"
                    name="maxMusicians"
                    defaultValue={selectedOrchestra.subscription?.maxMusicians || 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max projekt</label>
                  <input
                    type="number"
                    name="maxProjects"
                    defaultValue={selectedOrchestra.subscription?.maxProjects || 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Månadsavgift</label>
                  <input
                    type="number"
                    name="pricePerMonth"
                    defaultValue={selectedOrchestra.subscription?.pricePerMonth || 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
            </form>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  const form = document.getElementById('edit-orchestra-form') as HTMLFormElement
                  const formData = new FormData(form)
                  
                  try {
                    const response = await fetch(`/api/superadmin/orchestras/${selectedOrchestra.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: formData.get('name'),
                        plan: formData.get('plan'),
                        maxMusicians: formData.get('maxMusicians'),
                        maxProjects: formData.get('maxProjects'),
                        pricePerMonth: formData.get('pricePerMonth')
                      })
                    })

                    if (response.ok) {
                      alert('Ändringar sparade!')
                      setShowEditModal(false)
                      fetchOrchestras() // Refresh the list
                    } else {
                      alert('Kunde inte spara ändringar')
                    }
                  } catch (error) {
                    console.error('Error saving changes:', error)
                    alert('Ett fel uppstod')
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}