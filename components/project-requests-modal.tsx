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

  useEffect(() => {
    if (isOpen && needId) {
      fetchRequests()
    }
  }, [isOpen, needId])

  const fetchRequests = async () => {
    if (!needId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/requests`)
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      
      // Find the specific need
      const targetNeed = data.needs.find((need: any) => need.id === needId)
      setRequests(targetNeed)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Förfrågningar
          </h3>
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