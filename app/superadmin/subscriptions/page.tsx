'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Check, X, TrendingUp, Calendar, DollarSign } from 'lucide-react'

interface SubscriptionData {
  tenants: Array<{
    id: string
    name: string
    subdomain: string
    subscription: string
    subscriptionStatus: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    currentPeriodEnd?: string
    trialEndsAt?: string
    createdAt: string
  }>
  revenue: {
    monthly: number
    annual: number
    growth: number
  }
  subscriptionCounts: {
    trial: number
    small_ensemble: number
    medium_ensemble: number
    institution: number
  }
}

const PLAN_DETAILS = {
  trial: {
    name: 'Trial',
    price: 0,
    color: 'bg-gray-100 text-gray-700'
  },
  small_ensemble: {
    name: 'Small Ensemble',
    price: 79,
    color: 'bg-blue-100 text-blue-700'
  },
  medium_ensemble: {
    name: 'Medium Ensemble',
    price: 499,
    color: 'bg-purple-100 text-purple-700'
  },
  institution: {
    name: 'Institution',
    price: 1500,
    color: 'bg-orange-100 text-orange-700'
  }
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/superadmin/subscriptions')
      if (response.ok) {
        const subscriptionData = await response.json()
        setData(subscriptionData)
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (tenantId: string, newPlan: string) => {
    if (!confirm(`Uppgradera till ${PLAN_DETAILS[newPlan as keyof typeof PLAN_DETAILS].name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: newPlan })
      })

      if (response.ok) {
        alert('Prenumeration uppdaterad!')
        fetchSubscriptionData()
      }
    } catch (error) {
      console.error('Failed to update subscription:', error)
      alert('Kunde inte uppdatera prenumeration')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trialing':
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Trial</span>
      case 'active':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Aktiv</span>
      case 'past_due':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">Försenad</span>
      case 'canceled':
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">Avslutad</span>
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{status}</span>
    }
  }

  if (isLoading) {
    return <div className="p-8">Laddar prenumerationsdata...</div>
  }

  if (!data) {
    return <div className="p-8">Kunde inte ladda data</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Prenumerationshantering</h1>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Månadsintäkter</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${data.revenue.monthly}</p>
          <p className="text-sm text-gray-500 mt-1">MRR (Monthly Recurring Revenue)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Årsintäkter</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${data.revenue.annual}</p>
          <p className="text-sm text-gray-500 mt-1">ARR (Annual Recurring Revenue)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Tillväxt</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.revenue.growth}%</p>
          <p className="text-sm text-gray-500 mt-1">Senaste 30 dagarna</p>
        </div>
      </div>

      {/* Subscription Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prenumerationsfördelning</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.subscriptionCounts).map(([plan, count]) => {
            const details = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS]
            return (
              <div key={plan} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{count}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">{details.name}</p>
                <p className="text-xs text-gray-500">${details.price}/mån</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tenant Subscriptions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Alla prenumerationer</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nästa betalning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stripe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tenants.map((tenant) => {
                const plan = PLAN_DETAILS[tenant.subscription as keyof typeof PLAN_DETAILS]
                return (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-xs text-gray-500">{tenant.subdomain}.stagesub.com</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${plan.color}`}>
                        {plan.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tenant.subscriptionStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant.subscriptionStatus === 'trialing' && tenant.trialEndsAt ? (
                        <div>
                          <p>Trial slutar:</p>
                          <p className="text-xs">{new Date(tenant.trialEndsAt).toLocaleDateString('sv-SE')}</p>
                        </div>
                      ) : tenant.currentPeriodEnd ? (
                        new Date(tenant.currentPeriodEnd).toLocaleDateString('sv-SE')
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.stripeCustomerId ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {tenant.subscription !== 'institution' && (
                          <button
                            onClick={() => {
                              const plans = ['small_ensemble', 'medium_ensemble', 'institution']
                              const currentIndex = plans.indexOf(tenant.subscription)
                              if (currentIndex < plans.length - 1) {
                                handleUpgrade(tenant.id, plans[currentIndex + 1])
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Uppgradera
                          </button>
                        )}
                        {tenant.stripeCustomerId && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${tenant.stripeCustomerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Stripe →
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}