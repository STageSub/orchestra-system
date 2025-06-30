'use client'

import { useState, useEffect } from 'react'
import RequestStatusCard from './RequestStatusCard'

interface ProjectRequestsModalProps {
  projectId: number
  needId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function ProjectRequestsModal({
  projectId,
  needId,
  isOpen,
  onClose
}: ProjectRequestsModalProps) {
  const [requests, setRequests] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (isOpen && needId) {
      fetchRequests()
    }
  }, [isOpen, needId])

  // Auto-refresh requests every 10 seconds while modal is open
  useEffect(() => {
    if (!isOpen || !needId) return

    const intervalId = setInterval(() => {
      fetchRequests()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [isOpen, needId])

  const fetchRequests = async () => {
    if (!needId) return
    
    // Don't show loading on auto-refresh, only on initial load
    if (!requests) {
      setLoading(true)
    } else {
      setIsUpdating(true)
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requests`)
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      
      // Find the specific need
      const targetNeed = data.needs.find((need: any) => need.id === needId)
      setRequests(targetNeed)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setIsUpdating(false), 500) // Brief animation
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">
              Förfrågningar
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Uppdateras automatiskt</span>
              {isUpdating && (
                <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Laddar förfrågningar...</p>
            </div>
          ) : requests ? (
            <RequestStatusCard
              need={requests}
              projectId={projectId}
              onRequestsSent={fetchRequests}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Inga förfrågningar hittades
            </p>
          )}
        </div>
      </div>
    </div>
  )
}