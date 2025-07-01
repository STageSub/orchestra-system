'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalMusicians: number
  activeMusicians: number
  activeProjects: number
  totalRequests: number
  pendingResponses: number
  remindersCount: number
  responseRate: number
}

interface TrialStatus {
  isOnTrial: boolean
  daysRemaining: number
  trialEndsAt: string
  plan: string
  subscriptionStatus: string
}

interface Activity {
  id: number
  description: string
  icon: string
  color: string
  timestamp: string
  type: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)

  useEffect(() => {
    fetchDashboardStats()
    fetchActivities()
    fetchTrialStatus()
  }, [])

  // Auto-refresh dashboard data every 30 seconds when page is visible
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchDashboardStats()
        fetchActivities()
      }
    }, 30000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh immediately
        fetchDashboardStats()
        fetchActivities()
        fetchTrialStatus()
      }
    }

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch stats:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/activity')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setTrialStatus(data)
      }
    } catch (error) {
      console.error('Error fetching trial status:', error)
    }
  }
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just nu'
    if (diffMins < 60) return `${diffMins} min sedan`
    if (diffHours < 24) return `${diffHours} tim sedan`
    if (diffDays < 7) return `${diffDays} dag${diffDays === 1 ? '' : 'ar'} sedan`
    
    return date.toLocaleDateString('sv-SE')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Laddar...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Administrationspanel
      </h2>
      
      {/* Trial Status Widget */}
      {trialStatus?.isOnTrial && (
        <div className={`mb-8 rounded-lg p-6 ${
          trialStatus.daysRemaining <= 7 ? 'bg-yellow-50 border-2 border-yellow-400' : 
          trialStatus.daysRemaining <= 3 ? 'bg-red-50 border-2 border-red-400' : 
          'bg-blue-50 border-2 border-blue-400'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                trialStatus.daysRemaining <= 3 ? 'text-red-900' :
                trialStatus.daysRemaining <= 7 ? 'text-yellow-900' :
                'text-blue-900'
              }`}>
                {trialStatus.daysRemaining === 0 
                  ? 'Din prövotid upphör idag!' 
                  : `${trialStatus.daysRemaining} dagar kvar av prövotiden`}
              </h3>
              <p className={`mt-1 text-sm ${
                trialStatus.daysRemaining <= 3 ? 'text-red-700' :
                trialStatus.daysRemaining <= 7 ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                Din prövotid för {trialStatus.plan === 'small_ensemble' ? 'Small Ensemble' : 
                trialStatus.plan === 'medium_ensemble' ? 'Medium Ensemble' : 'Institution'} planen 
                upphör {new Date(trialStatus.trialEndsAt).toLocaleDateString('sv-SE')}
              </p>
            </div>
            <div>
              <Link
                href="/admin/settings/subscription"
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  trialStatus.daysRemaining <= 3 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Uppgradera nu
              </Link>
            </div>
          </div>
          {trialStatus.daysRemaining <= 7 && (
            <div className="mt-4 text-sm">
              <p className={
                trialStatus.daysRemaining <= 3 ? 'text-red-700 font-medium' : 'text-yellow-700'
              }>
                {trialStatus.daysRemaining <= 3 
                  ? '⚠️ Efter prövotiden kommer vissa funktioner att begränsas tills du uppgraderar.'
                  : '💡 Tips: Uppgradera nu för att få 20% rabatt på första månaden!'}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Statistik-kort */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Totalt antal musiker</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.totalMusicians || 0}</p>
          <p className="mt-1 text-sm text-gray-600">{stats?.activeMusicians || 0} aktiva</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Aktiva projekt</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.activeProjects || 0}</p>
          <p className="mt-1 text-sm text-gray-600">{stats?.totalRequests || 0} förfrågningar</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Väntande svar</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.pendingResponses || 0}</p>
          <p className="mt-1 text-sm text-gray-600">{stats?.remindersCount || 0} påminnelser skickade</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Svarsfrekvens</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats?.responseRate || 0}%</p>
          <p className="mt-1 text-sm text-gray-600">Senaste 30 dagarna</p>
        </div>
      </div>

      {/* Snabblänkar */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Snabbåtgärder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/musicians/new"
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            + Ny musiker
          </Link>
          <Link
            href="/admin/projects/new"
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            + Nytt projekt
          </Link>
          <Link
            href="/admin/rankings"
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            Hantera rankningar
          </Link>
        </div>
      </div>

      {/* Senaste aktivitet */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Senaste aktivitet</h3>
        </div>
        <div className="p-6">
          {loadingActivities ? (
            <p className="text-sm text-gray-500">Laddar aktiviteter...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500">Ingen aktivitet ännu</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${activity.color}`}>
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length >= 3 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/admin/activities"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Visa alla aktiviteter →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}