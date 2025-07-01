'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const subscriptionPlans = [
  {
    id: 'small_ensemble',
    name: 'Liten Ensemble',
    price: '$79/månad',
    limits: {
      musicians: 50,
      projects: 5,
      instruments: 10
    }
  },
  {
    id: 'medium_ensemble',
    name: 'Medium Ensemble',
    price: '$499/månad',
    limits: {
      musicians: 200,
      projects: 20,
      instruments: 99999
    }
  },
  {
    id: 'institution',
    name: 'Institution',
    price: '$1,500/månad',
    limits: {
      musicians: 99999,
      projects: 99999,
      instruments: 99999
    }
  }
]

export default function NewTenantPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    subscription: 'small_ensemble',
    adminEmail: '',
    adminPassword: '',
    adminName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = subscriptionPlans.find(p => p.id === formData.subscription)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create tenant')
      }

      alert('Tenant skapad!')
      router.push('/superadmin/tenants')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubdomainChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData({ ...formData, subdomain: cleaned })
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
        <h1 className="text-2xl font-bold text-gray-900">Skapa ny tenant</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Organization Info */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Organisationsinformation</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organisationsnamn
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Göteborgs Symfoniker"
                />
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomän
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="subdomain"
                    required
                    value={formData.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="goteborg"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .stagesub.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Prenumerationsplan</h2>
            
            <div className="space-y-3">
              {subscriptionPlans.map((plan) => (
                <label
                  key={plan.id}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.subscription === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="subscription"
                    value={plan.id}
                    checked={formData.subscription === plan.id}
                    onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">
                          Max {plan.limits.musicians} musiker, {plan.limits.projects} aktiva projekt
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{plan.price}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Admin User */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Administratör</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  Namn
                </label>
                <input
                  type="text"
                  id="adminName"
                  required
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Anna Andersson"
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  E-post
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="admin@orchestra.se"
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Lösenord
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  required
                  minLength={8}
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Minst 8 tecken"
                />
              </div>
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
              {isSubmitting ? 'Skapar...' : 'Skapa tenant'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/superadmin/tenants')}
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