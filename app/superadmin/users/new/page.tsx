'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  subdomain: string
}

export default function NewUserPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    tenantId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
        // Set first tenant as default if not superadmin
        if (data.length > 0 && formData.role !== 'superadmin') {
          setFormData(prev => ({ ...prev, tenantId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      alert('Användare skapad!')
      router.push('/superadmin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role })
    // Clear tenantId if superadmin
    if (role === 'superadmin') {
      setFormData(prev => ({ ...prev, tenantId: '' }))
    } else if (tenants.length > 0 && !formData.tenantId) {
      setFormData(prev => ({ ...prev, tenantId: tenants[0].id }))
    }
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/superadmin/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Skapa ny användare</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* User Info */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Användarinformation</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Namn
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Anna Andersson"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-post
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="anna@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Lösenord
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Minst 8 tecken"
                />
              </div>
            </div>
          </div>

          {/* Role & Tenant */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Roll och organisation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="superadmin"
                      checked={formData.role === 'superadmin'}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Superadmin</p>
                      <p className="text-sm text-gray-500">Full tillgång till alla tenants och systemfunktioner</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-sm text-gray-500">Full tillgång inom en specifik organisation</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Användare</p>
                      <p className="text-sm text-gray-500">Begränsad tillgång inom en organisation</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.role !== 'superadmin' && (
                <div>
                  <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700">
                    Organisation
                  </label>
                  <select
                    id="tenantId"
                    required
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Välj organisation</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.subdomain})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Skapar...' : 'Skapa användare'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/superadmin/users')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Avbryt
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}