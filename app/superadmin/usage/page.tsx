'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Music, 
  FileText, 
  HardDrive,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface TenantUsage {
  id: string
  name: string
  subdomain: string
  subscription: string
  usage: {
    musicians: {
      current: number
      limit: number
      percentage: number
    }
    projects: {
      current: number
      limit: number
      percentage: number
    }
    instruments: {
      current: number
      limit: number
      percentage: number
    }
    storage: {
      currentMB: number
      limitMB: number
      percentage: number
    }
    requests: {
      currentMonth: number
      lastMonth: number
      trend: number
    }
  }
  status: 'healthy' | 'warning' | 'critical'
}

export default function UsageMonitoringPage() {
  const [tenantUsage, setTenantUsage] = useState<TenantUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'status'>('status')

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/superadmin/usage')
      if (response.ok) {
        const data = await response.json()
        setTenantUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50'
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const sortedTenants = [...tenantUsage].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'usage') {
      const aMax = Math.max(
        a.usage.musicians.percentage,
        a.usage.projects.percentage,
        a.usage.instruments.percentage
      )
      const bMax = Math.max(
        b.usage.musicians.percentage,
        b.usage.projects.percentage,
        b.usage.instruments.percentage
      )
      return bMax - aMax
    }
    if (sortBy === 'status') {
      const statusOrder = { critical: 0, warning: 1, healthy: 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return 0
  })

  if (isLoading) {
    return <div className="p-8">Laddar användningsdata...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Användningsövervakning</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('status')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              sortBy === 'status' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setSortBy('usage')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              sortBy === 'usage' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Användning
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              sortBy === 'name' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Namn
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{tenant.name}</h2>
                <p className="text-sm text-gray-500">{tenant.subdomain}.stagesub.com</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {tenant.subscription}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  tenant.status === 'critical' ? 'bg-red-100 text-red-700' :
                  tenant.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tenant.status === 'critical' && <AlertTriangle className="w-3 h-3" />}
                  {tenant.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                  {tenant.status === 'healthy' && <CheckCircle className="w-3 h-3" />}
                  {tenant.status === 'critical' ? 'Kritisk' :
                   tenant.status === 'warning' ? 'Varning' : 'OK'}
                </span>
              </div>
            </div>

            {/* Usage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Musicians */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Musiker</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tenant.usage.musicians.percentage >= 90 ? 'text-red-600' :
                    tenant.usage.musicians.percentage >= 80 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {tenant.usage.musicians.current}/{tenant.usage.musicians.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressBarColor(tenant.usage.musicians.percentage)}`}
                    style={{ width: `${Math.min(tenant.usage.musicians.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{tenant.usage.musicians.percentage}% använt</p>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Projekt</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tenant.usage.projects.percentage >= 90 ? 'text-red-600' :
                    tenant.usage.projects.percentage >= 80 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {tenant.usage.projects.current}/{tenant.usage.projects.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressBarColor(tenant.usage.projects.percentage)}`}
                    style={{ width: `${Math.min(tenant.usage.projects.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{tenant.usage.projects.percentage}% använt</p>
              </div>

              {/* Instruments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Instrument</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tenant.usage.instruments.percentage >= 90 ? 'text-red-600' :
                    tenant.usage.instruments.percentage >= 80 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {tenant.usage.instruments.current}/{tenant.usage.instruments.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressBarColor(tenant.usage.instruments.percentage)}`}
                    style={{ width: `${Math.min(tenant.usage.instruments.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{tenant.usage.instruments.percentage}% använt</p>
              </div>

              {/* Storage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Lagring</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {tenant.usage.storage.currentMB} MB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressBarColor(tenant.usage.storage.percentage)}`}
                    style={{ width: `${Math.min(tenant.usage.storage.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{tenant.usage.storage.percentage}% av {tenant.usage.storage.limitMB} MB</p>
              </div>
            </div>

            {/* Request Statistics */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Förfrågningar denna månad</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  {tenant.usage.requests.currentMonth}
                </span>
                {tenant.usage.requests.trend !== 0 && (
                  <span className={`text-sm flex items-center gap-1 ${
                    tenant.usage.requests.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-3 h-3 ${
                      tenant.usage.requests.trend < 0 ? 'rotate-180' : ''
                    }`} />
                    {Math.abs(tenant.usage.requests.trend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sammanfattning</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tenants nära gräns (80%+)</p>
            <p className="text-2xl font-bold text-yellow-600">
              {tenantUsage.filter(t => t.status === 'warning').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tenants över gräns (90%+)</p>
            <p className="text-2xl font-bold text-red-600">
              {tenantUsage.filter(t => t.status === 'critical').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total lagring använd</p>
            <p className="text-2xl font-bold text-gray-900">
              {tenantUsage.reduce((sum, t) => sum + t.usage.storage.currentMB, 0)} MB
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}