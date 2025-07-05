'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, Activity, Database, Building } from 'lucide-react'
import CustomerManagement from '@/components/superadmin/CustomerManagement'
import OrchestraManagement from '@/components/superadmin/OrchestraManagement'
import UserManagement from '@/components/superadmin/UserManagement'

interface OrchestraData {
  id: string
  orchestraId: string
  name: string
  subdomain: string
  status: string
  logoUrl?: string
  subscription: {
    plan: string
    status: string
    pricePerMonth: number
  } | null
  metrics: {
    totalMusicians: number
    activeMusicians: number
    totalProjects: number
    activeProjects: number
    totalRequests: number
    acceptedRequests: number
    createdAt: string
  }[]
}

interface MetricsData {
  orchestras: OrchestraData[]
  metrics: {
    totalMusicians: number
    activeMusicians: number
    totalProjects: number
    activeProjects: number
    totalRequests: number
    acceptedRequests: number
  }
  revenue: {
    mrr: number
    currency: string
  }
  recentEvents: {
    id: string
    type: string
    severity: string
    title: string
    description: string
    createdAt: string
    orchestra?: {
      name: string
    }
  }[]
}

export default function SuperAdminDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'orchestras' | 'users'>('overview')
  const [selectedOrchestra, setSelectedOrchestra] = useState<string>('')
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const metricsResponse = await fetch('/api/superadmin/metrics')
      
      if (metricsResponse.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/admin/login'
        return
      }
      
      if (metricsResponse.ok) {
        const data = await metricsResponse.json()
        console.log('Metrics data received:', data)
        console.log('Number of orchestras:', data.orchestras?.length || 0)
        console.log('Number of recent events:', data.recentEvents?.length || 0)
        setMetricsData(data)
      } else {
        console.error('Failed to fetch metrics:', metricsResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetDemo = async () => {
    if (resetConfirmText !== 'RESET SCOSO') {
      alert('Du måste skriva "RESET SCOSO" för att bekräfta')
      return
    }

    setIsResetting(true)
    try {
      // Find SCOSO orchestra
      const scoscoOrchestra = metricsData?.orchestras.find(o => o.subdomain === 'scosco')
      if (!scoscoOrchestra) {
        alert('SCOSO orchestra hittades inte')
        return
      }

      const response = await fetch(`/api/superadmin/orchestras/${scoscoOrchestra.id}/reset-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        alert('SCOSO demo har återställts!')
        setResetModalOpen(false)
        setResetConfirmText('')
        // Refresh data
        await fetchData()
      } else {
        const error = await response.json()
        alert(`Fel: ${error.error || 'Kunde inte återställa demo'}`)
      }
    } catch (error) {
      console.error('Reset error:', error)
      alert('Ett fel uppstod vid återställning')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return <div>Laddar statistik...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Översikt
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'customers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kundhantering
          </button>
          <button
            onClick={() => setActiveTab('orchestras')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'orchestras'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orkestrar
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Användare
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal orkestrar</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsData?.orchestras.length || 0}
              </p>
            </div>
            <Building className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metricsData?.orchestras.filter(o => o.status === 'active').length || 0} aktiva
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal musiker</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsData?.metrics.totalMusicians || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metricsData?.metrics.activeMusicians || 0} aktiva
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal projekt</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsData?.metrics.totalProjects || 0}
              </p>
            </div>
            <Activity className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {metricsData?.metrics.activeProjects || 0} aktiva
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Månadsintäkter (MRR)</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {new Intl.NumberFormat('sv-SE', { 
                  style: 'currency', 
                  currency: metricsData?.revenue.currency || 'SEK' 
                }).format(metricsData?.revenue.mrr || 0)}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Månatlig återkommande intäkt</p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Kunder</h2>
          <a
            href="/superadmin/orchestras/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <Building className="w-4 h-4" />
            Skapa ny orkester
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Musiker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projekt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senaste aktivitet
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metricsData?.orchestras.map((orchestra) => (
                <tr key={orchestra.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {orchestra.logoUrl ? (
                        <img 
                          src={orchestra.logoUrl} 
                          alt="" 
                          className="w-8 h-8 object-contain mr-3 rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-xs font-medium text-gray-600">
                            {orchestra.name.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {orchestra.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{orchestra.orchestraId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {orchestra.metrics[0]?.totalMusicians || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {orchestra.metrics[0]?.totalProjects || 0} ({orchestra.metrics[0]?.activeProjects || 0} aktiva)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      orchestra.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : orchestra.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : orchestra.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {orchestra.status === 'active' ? 'Aktiv' : 
                       orchestra.status === 'pending' ? 'Väntar' :
                       orchestra.status === 'error' ? 'Fel' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {orchestra.metrics[0] ? new Date(orchestra.metrics[0].createdAt).toLocaleDateString('sv-SE') : 'Ingen aktivitet'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => window.open(`/admin?orchestra=${orchestra.orchestraId}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Öppna
                    </button>
                    <button 
                      onClick={() => setActiveTab('customers')}
                      className="text-gray-600 hover:text-gray-900 mr-4"
                    >
                      Hantera
                    </button>
                    {orchestra.subdomain === 'scosco' && (
                      <button 
                        onClick={() => setResetModalOpen(true)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Återställ Demo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow-sm border mt-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Senaste händelser</h2>
          <select 
            className="text-sm border-gray-300 rounded-md"
            value={selectedOrchestra}
            onChange={(e) => setSelectedOrchestra(e.target.value)}
          >
            <option value="">Alla orkestrar</option>
            {metricsData?.orchestras.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {!metricsData?.recentEvents || metricsData.recentEvents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Inga händelser att visa
            </div>
          ) : metricsData.recentEvents
            .filter(event => !selectedOrchestra || event.orchestra?.id === selectedOrchestra)
            .map((event) => (
            <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {event.orchestra && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {event.orchestra.name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      event.severity === 'error' ? 'bg-red-100 text-red-800' :
                      event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.severity === 'error' ? 'Fel' :
                       event.severity === 'warning' ? 'Varning' : 'Info'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(event.createdAt).toLocaleDateString('sv-SE')} {new Date(event.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      ) : activeTab === 'customers' ? (
        <CustomerManagement />
      ) : activeTab === 'orchestras' ? (
        <OrchestraManagement />
      ) : (
        <UserManagement />
      )}

      {/* Reset Demo Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Återställ SCOSO Demo
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Detta kommer att ta bort alla musiker och projekt från SCOSO-orkestern. 
              Denna åtgärd kan inte ångras.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              För att bekräfta, skriv <span className="font-mono font-semibold">RESET SCOSO</span> nedan:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="Skriv här..."
              disabled={isResetting}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setResetModalOpen(false)
                  setResetConfirmText('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isResetting}
              >
                Avbryt
              </button>
              <button
                onClick={handleResetDemo}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={resetConfirmText !== 'RESET SCOSO' || isResetting}
              >
                {isResetting ? 'Återställer...' : 'Återställ Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}