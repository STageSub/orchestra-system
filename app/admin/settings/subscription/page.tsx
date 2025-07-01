'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, AlertCircle, Loader2 } from 'lucide-react'

interface SubscriptionInfo {
  plan: string
  status: string
  trialEndsAt?: string
  currentPeriodEnd?: string
  usage: {
    musicians: { current: number; limit: number }
    projects: { current: number; limit: number }
    instruments: { current: number; limit: number }
  }
}

const PLANS = {
  small_ensemble: {
    name: 'Small Ensemble',
    price: 79,
    limits: {
      musicians: 50,
      projects: 5,
      instruments: 10
    },
    features: [
      'Upp till 50 musiker',
      '5 aktiva projekt',
      '10 instrument',
      'E-postsupport',
      'Grundläggande rapporter'
    ]
  },
  medium_ensemble: {
    name: 'Medium Ensemble',
    price: 499,
    limits: {
      musicians: 200,
      projects: 20,
      instruments: -1
    },
    features: [
      'Upp till 200 musiker',
      '20 aktiva projekt',
      'Obegränsat med instrument',
      'Prioriterad support',
      'Avancerade rapporter',
      'Egen subdomain',
      'Anpassad logotyp'
    ]
  },
  institution: {
    name: 'Institution',
    price: 1500,
    limits: {
      musicians: -1,
      projects: -1,
      instruments: -1
    },
    features: [
      'Obegränsat antal musiker',
      'Obegränsat med projekt',
      'Obegränsat med instrument',
      'Dedikerad databas (valfritt)',
      'Full anpassning',
      'API-åtkomst',
      'Prioriterad support (4h)',
      'Dedikerad account manager'
    ]
  }
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      const [subResponse, usageResponse] = await Promise.all([
        fetch('/api/subscription/status'),
        fetch('/api/subscription/usage')
      ])

      if (subResponse.ok && usageResponse.ok) {
        const subData = await subResponse.json()
        const usageData = await usageResponse.json()
        
        setSubscription({
          plan: subData.plan,
          status: subData.subscriptionStatus,
          trialEndsAt: subData.trialEndsAt,
          currentPeriodEnd: subData.currentPeriodEnd,
          usage: usageData
        })
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (newPlan: string) => {
    if (confirm(`Är du säker på att du vill uppgradera till ${PLANS[newPlan as keyof typeof PLANS].name}?`)) {
      setIsUpgrading(true)
      try {
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: newPlan })
        })

        if (response.ok) {
          alert('Uppgradering lyckades! Du kommer snart omdirigeras till betalningssidan.')
          // In production, redirect to Stripe checkout
          window.location.reload()
        } else {
          alert('Uppgradering misslyckades. Försök igen senare.')
        }
      } catch (error) {
        console.error('Upgrade error:', error)
        alert('Ett fel uppstod vid uppgradering.')
      } finally {
        setIsUpgrading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'small_ensemble'
  const currentPlanDetails = PLANS[currentPlan as keyof typeof PLANS]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/settings"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till inställningar
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Prenumeration & Fakturering</h1>
      </div>

      {/* Current Plan Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Nuvarande plan: {currentPlanDetails.name}
            </h2>
            <p className="text-gray-600">
              {subscription?.status === 'trialing' ? (
                <>
                  <span className="text-blue-600 font-medium">Prövotid</span> - 
                  Upphör {new Date(subscription.trialEndsAt!).toLocaleDateString('sv-SE')}
                </>
              ) : subscription?.status === 'active' ? (
                <>
                  <span className="text-green-600 font-medium">Aktiv</span> - 
                  Förnyas {new Date(subscription.currentPeriodEnd!).toLocaleDateString('sv-SE')}
                </>
              ) : (
                <span className="text-red-600 font-medium">Inaktiv</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${currentPlanDetails.price}</p>
            <p className="text-gray-500">/månad</p>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Musiker</span>
              <span className="text-gray-900 font-medium">
                {subscription?.usage.musicians.current || 0} / 
                {subscription?.usage.musicians.limit === -1 ? '∞' : subscription?.usage.musicians.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: subscription?.usage.musicians.limit === -1 
                    ? '0%' 
                    : `${(subscription?.usage.musicians.current || 0) / (subscription?.usage.musicians.limit || 1) * 100}%` 
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Projekt</span>
              <span className="text-gray-900 font-medium">
                {subscription?.usage.projects.current || 0} / 
                {subscription?.usage.projects.limit === -1 ? '∞' : subscription?.usage.projects.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ 
                  width: subscription?.usage.projects.limit === -1 
                    ? '0%' 
                    : `${(subscription?.usage.projects.current || 0) / (subscription?.usage.projects.limit || 1) * 100}%` 
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Instrument</span>
              <span className="text-gray-900 font-medium">
                {subscription?.usage.instruments.current || 0} / 
                {subscription?.usage.instruments.limit === -1 ? '∞' : subscription?.usage.instruments.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ 
                  width: subscription?.usage.instruments.limit === -1 
                    ? '0%' 
                    : `${(subscription?.usage.instruments.current || 0) / (subscription?.usage.instruments.limit || 1) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {subscription?.status === 'trialing' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Du är för närvarande på en gratis prövotid. Uppgradera för att fortsätta använda alla funktioner efter att prövotiden löper ut.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Tillgängliga planer</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([planKey, plan]) => {
          const isCurrent = planKey === currentPlan
          const isUpgrade = Object.keys(PLANS).indexOf(planKey) > Object.keys(PLANS).indexOf(currentPlan)
          
          return (
            <div
              key={planKey}
              className={`rounded-lg border-2 ${
                isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              } p-6`}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 ml-2">/månad</span>
                </div>
                {isCurrent && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                    Nuvarande plan
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && isUpgrade && (
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={isUpgrading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center"
                >
                  {isUpgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Uppgradera
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Billing Information */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Faktureringsinformation</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Betalningsmetod</p>
            <p className="text-gray-900">
              {subscription?.status === 'trialing' ? 'Ingen betalningsmetod krävs under prövotiden' : 'Kort slutar på •••• 4242'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Nästa faktura</p>
            <p className="text-gray-900">
              {subscription?.status === 'trialing' 
                ? `Efter prövotiden (${new Date(subscription.trialEndsAt!).toLocaleDateString('sv-SE')})`
                : subscription?.currentPeriodEnd 
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString('sv-SE')
                  : 'Ingen aktiv prenumeration'}
            </p>
          </div>
        </div>

        {subscription?.status !== 'trialing' && (
          <div className="mt-6 pt-6 border-t">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Uppdatera betalningsmetod
            </button>
          </div>
        )}
      </div>
    </div>
  )
}