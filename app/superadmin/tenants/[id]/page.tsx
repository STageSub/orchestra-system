'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, Activity, Database, CreditCard } from 'lucide-react'

interface TenantDetails {
  id: string
  name: string
  subdomain: string
  subscription: string
  subscriptionStatus: string
  maxMusicians: number
  maxActiveProjects: number
  maxInstruments: number
  logoUrl?: string
  primaryColor?: string
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    email: string
    name?: string
    role: string
    lastLoginAt?: string
    createdAt: string
  }>
  _count: {
    musicians: number
    instruments: number
    projects: number
    users: number
  }
  usage: {
    activeProjects: number
    totalRequests: number
  }
}

const subscriptionOptions = [
  { value: 'trial', label: 'Testperiod' },
  { value: 'small_ensemble', label: 'Liten Ensemble' },
  { value: 'medium_ensemble', label: 'Medium Ensemble' },
  { value: 'institution', label: 'Institution' }
]

const statusOptions = [
  { value: 'trialing', label: 'På prov' },
  { value: 'active', label: 'Aktiv' },
  { value: 'past_due', label: 'Försenad betalning' },
  { value: 'canceled', label: 'Avbruten' }
]

export default function TenantDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subscription: '',
    subscriptionStatus: '',
    maxMusicians: 0,
    maxActiveProjects: 0,
    maxInstruments: 0
  })

  useEffect(() => {
    fetchTenant()
  }, [params.id])

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTenant(data)
        setFormData({
          name: data.name,
          subscription: data.subscription,
          subscriptionStatus: data.subscriptionStatus,
          maxMusicians: data.maxMusicians,
          maxActiveProjects: data.maxActiveProjects,
          maxInstruments: data.maxInstruments
        })
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/superadmin/tenants/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Tenant uppdaterad!')
        fetchTenant()
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
      alert('Kunde inte uppdatera tenant')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div>Laddar tenant...</div>
  }

  if (!tenant) {
    return <div>Tenant hittades inte</div>
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/superadmin/tenants')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Grundinställningar</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Organisationsnamn</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subdomän</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={tenant.subdomain}
                    disabled
                    className="flex-1 rounded-none rounded-l-md border-gray-300 bg-gray-50"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .stagesub.com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prenumeration</label>
                  <select
                    value={formData.subscription}
                    onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {subscriptionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.subscriptionStatus}
                    onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Gränser</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Max musiker</label>
                <input
                  type="number"
                  value={formData.maxMusicians}
                  onChange={(e) => setFormData({ ...formData, maxMusicians: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Används: {tenant._count.musicians}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max aktiva projekt</label>
                <input
                  type="number"
                  value={formData.maxActiveProjects}
                  onChange={(e) => setFormData({ ...formData, maxActiveProjects: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Används: {tenant.usage.activeProjects}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max instrument</label>
                <input
                  type="number"
                  value={formData.maxInstruments}
                  onChange={(e) => setFormData({ ...formData, maxInstruments: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Används: {tenant._count.instruments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Användare</h2>
            
            <div className="space-y-3">
              {tenant.users.map(user => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{user.name || 'Ingen namn'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.role}</p>
                    <p className="text-xs text-gray-500">
                      {user.lastLoginAt ? `Senast inloggad: ${new Date(user.lastLoginAt).toLocaleDateString('sv-SE')}` : 'Aldrig inloggad'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistik</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span>Användare</span>
                </div>
                <span className="font-medium">{tenant._count.users}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Activity className="w-5 h-5" />
                  <span>Musiker</span>
                </div>
                <span className="font-medium">{tenant._count.musicians}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Database className="w-5 h-5" />
                  <span>Projekt</span>
                </div>
                <span className="font-medium">{tenant._count.projects}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-5 h-5" />
                  <span>Förfrågningar</span>
                </div>
                <span className="font-medium">{tenant.usage.totalRequests}</span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Information</h3>
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Skapad</p>
                <p className="font-medium">{new Date(tenant.createdAt).toLocaleDateString('sv-SE')}</p>
              </div>
              <div>
                <p className="text-gray-600">Uppdaterad</p>
                <p className="font-medium">{new Date(tenant.updatedAt).toLocaleDateString('sv-SE')}</p>
              </div>
              <div>
                <p className="text-gray-600">Tenant ID</p>
                <p className="font-mono text-xs">{tenant.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}