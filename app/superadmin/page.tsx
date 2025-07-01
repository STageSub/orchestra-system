'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, CreditCard, Activity, TrendingUp, AlertCircle } from 'lucide-react'

interface SuperadminStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalRevenue: number
  growthRate: number
  alerts: Array<{
    id: string
    type: 'warning' | 'error'
    message: string
    tenantName?: string
  }>
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperadminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/superadmin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Laddar statistik...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Superadmin Översikt</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal tenants</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.totalTenants || 0}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.activeTenants || 0} aktiva
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal användare</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Månadsintäkter</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ${stats?.totalRevenue || 0}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tillväxt</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.growthRate || 0}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Senaste 30 dagarna</p>
        </div>
      </div>

      {/* Alerts */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Systemvarningar
          </h2>
          <div className="space-y-3">
            {stats.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md ${
                  alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                <p className="text-sm">
                  {alert.tenantName && <span className="font-medium">{alert.tenantName}: </span>}
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Senaste aktivitet</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center py-8">
            Ingen aktivitet att visa än
          </p>
        </div>
      </div>
    </div>
  )
}