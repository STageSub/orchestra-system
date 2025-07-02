'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, CreditCard, Activity, TrendingUp, AlertCircle, Database } from 'lucide-react'

interface CustomerStats {
  subdomain: string
  name: string
  musicians: number
  projects: number
  activeProjects: number
  lastActivity: string
  status: 'active' | 'inactive'
}

interface SuperadminStats {
  totalCustomers: number
  activeCustomers: number
  totalMusicians: number
  totalProjects: number
  totalRevenue: number
  growthRate: number
  customers: CustomerStats[]
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
              <p className="text-sm font-medium text-gray-600">Totalt antal kunder</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.totalCustomers || 0}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.activeCustomers || 0} aktiva
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal musiker</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.totalMusicians || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Över alla kunder</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt antal projekt</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {stats?.totalProjects || 0}
              </p>
            </div>
            <Activity className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Över alla kunder</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Månadsintäkter</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ${stats?.totalRevenue || 0}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Baserat på kunder</p>
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
                  Subdomän
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
              {stats?.customers.map((customer) => (
                <tr key={customer.subdomain}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.subdomain}.stagesub.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.musicians}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.projects} ({customer.activeProjects} aktiva)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastActivity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={`https://${customer.subdomain}.stagesub.com/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Öppna
                    </a>
                    <button className="text-gray-600 hover:text-gray-900">
                      Hantera
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}