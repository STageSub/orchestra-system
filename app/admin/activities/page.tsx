'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Activity {
  id: number
  description: string
  icon: string
  color: string
  timestamp: string
  type: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/activity?limit=${limit}&skip=0`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setHasMore(data.hasMore || false)
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/activity?limit=${limit}&skip=${activities.length}`)
      if (response.ok) {
        const data = await response.json()
        setActivities([...activities, ...(data.activities || [])])
        setHasMore(data.hasMore || false)
      }
    } catch (error) {
      console.error('Error fetching more activities:', error)
    } finally {
      setLoading(false)
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
    
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till översikt
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Alla aktiviteter</h2>
        <p className="mt-1 text-sm text-gray-600">
          Visar {activities.length} av {total} aktiviteter
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading && activities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">Laddar aktiviteter...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">Ingen aktivitet ännu</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${activity.color}`}>
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {hasMore && !loading && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Visa fler aktiviteter
            </button>
          </div>
        )}
        
        {loading && activities.length > 0 && (
          <div className="p-4 text-center border-t">
            <p className="text-sm text-gray-500">Laddar fler...</p>
          </div>
        )}
      </div>
    </div>
  )
}