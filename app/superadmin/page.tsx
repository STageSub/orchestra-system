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

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/superadmin/metrics')
      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/admin/login'
        return
      }
      if (response.ok) {
        const data = await response.json()
        setMetricsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
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
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Kunder</h2>
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
                      <Database className="w-8 h-8 text-gray-400 mr-3" />
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
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {orchestra.status === 'active' ? 'Aktiv' : 'Inaktiv'}
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
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Hantera
                    </button>
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
            onChange={(e) => {
              // TODO: Implement orchestra filter
              console.log('Filter by orchestra:', e.target.value)
            }}
          >
            <option value="">Alla orkestrar</option>
            {metricsData?.orchestras.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {metricsData?.recentEvents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Inga händelser att visa
            </div>
          ) : metricsData?.recentEvents.map((event) => (
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
    </div>
  )
}