'use client'

import { useState, useEffect } from 'react'
import SendRequestsPreviewModal from './send-requests-preview-modal'
import { formatHoursToReadable } from '@/lib/utils'

interface Musician {
  id: number
  name: string
  email: string
  phone: string | null
}

interface Request {
  id: number
  requestId: string
  musician: Musician
  status: string
  sentAt: string
  reminderSentAt: string | null
  respondedAt: string | null
  response: string | null
  confirmationSent: boolean
  communicationHistory: Array<{
    type: string
    timestamp: string
  }>
}

interface RequestStatus {
  acceptedCount: number
  pendingCount: number
  declinedCount: number
  totalRequests: number
  isFullyStaffed: boolean
  remainingNeeded: number
}

interface RequestNeed {
  id: number
  projectNeedId: string
  position: {
    id: number
    name: string
    instrument: string
  }
  quantity: number
  rankingList: {
    id: number
    listType: string
  }
  requestStrategy: string
  maxRecipients: number | null
  responseTimeHours: number | null
  needStatus?: string
  status: RequestStatus
  requests: Request[]
  nextInQueue?: Array<{
    id: number
    name: string
    rank: number
  }>
  totalInQueue?: number
}

interface RequestStatusCardProps {
  need: RequestNeed
  projectId: number
  onRequestsSent: () => void
}

export default function RequestStatusCard({ need, projectId, onRequestsSent }: RequestStatusCardProps) {
  const [sending, setSending] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  // Update lastRefreshed when need data changes
  useEffect(() => {
    setLastRefreshed(new Date())
  }, [need])

  const getTimeWaiting = (sentAt: string) => {
    const sent = new Date(sentAt)
    const now = new Date()
    const hoursWaiting = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60))
    
    return formatHoursToReadable(hoursWaiting)
  }

  const getWaitingIndicator = (sentAt: string, responseTimeHours: number | null) => {
    const sent = new Date(sentAt)
    const now = new Date()
    const hoursWaiting = (now.getTime() - sent.getTime()) / (1000 * 60 * 60)
    const totalHours = responseTimeHours || 24
    const percentage = (hoursWaiting / totalHours) * 100

    if (percentage >= 100) {
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Utgången' }
    } else if (percentage >= 75) {
      return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Snart utgången' }
    } else if (percentage >= 50) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Väntat länge' }
    } else {
      return { color: 'text-green-600', bg: 'bg-green-100', label: 'Nyligen skickad' }
    }
  }

  const handleSendRequests = async () => {
    setSending(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/send-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectNeedId: need.id })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}`)
        onRequestsSent()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte skicka förfrågningar')
      }
    } catch (error) {
      console.error('Error sending requests:', error)
      alert('Ett fel uppstod')
    } finally {
      setSending(false)
    }
  }

  const handleTogglePause = async () => {
    // Show warning when pausing
    if (need.needStatus !== 'paused' && need.status.pendingCount > 0) {
      const confirmed = confirm(
        'OBS! Väntande förfrågningar förblir aktiva. Musiker kan fortfarande svara.\n\n' +
        'Endast NYA förfrågningar pausas.\n\n' +
        'Vill du fortsätta?'
      )
      if (!confirmed) return
    }

    setUpdating(true)
    try {
      const newStatus = need.needStatus === 'paused' ? 'active' : 'paused'
      const response = await fetch(`/api/projects/${projectId}/needs/${need.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        onRequestsSent() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte uppdatera status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Ett fel uppstod')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'sequential':
        return 'Sekventiell'
      case 'parallel':
        return 'Parallell'
      case 'first_come':
        return 'Först till kvarn'
      default:
        return strategy
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {need.position.instrument} - {need.position.name}
              </h3>
              {need.status.isFullyStaffed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Uppfyllt
                </span>
              )}
              {need.needStatus === 'paused' && !need.status.isFullyStaffed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⏸ Pausad
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Lista {need.rankingList.listType} • {getStrategyLabel(need.requestStrategy)}
              {need.maxRecipients && ` • Max ${need.maxRecipients} mottagare`}
            </p>
          </div>
          
          {/* Progress and Pause Button */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {need.status.acceptedCount}/{need.quantity}
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>{need.status.pendingCount} väntar</span>
                <span>•</span>
                <span>{need.status.declinedCount} avböjt</span>
              </div>
            </div>
            
            {/* Pause button moved here */}
            {need.status.totalRequests > 0 && !need.status.isFullyStaffed && need.needStatus !== 'completed' && (
              <button
                onClick={handleTogglePause}
                disabled={updating}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  need.needStatus === 'paused' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } disabled:opacity-50`}
              >
                {updating ? '...' : need.needStatus === 'paused' ? 'Återuppta' : 'Pausa'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Section */}
      {need.needStatus !== 'archived' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Status explanation - more compact */}
          {!need.status.isFullyStaffed && (
            <p className="text-xs text-gray-600 italic mb-3">
              {need.requestStrategy === 'sequential' && need.status.pendingCount > 0 && 
                'Väntar på svar. Nästa musiker kontaktas automatiskt vid avböjande.'}
              {need.requestStrategy === 'parallel' && need.status.pendingCount + need.status.acceptedCount >= need.quantity && 
                'Tillräckligt med förfrågningar utskickade. Påfyllning sker automatiskt.'}
              {need.requestStrategy === 'first_come' && need.status.pendingCount > 0 && 
                `Väntar på svar från ${need.status.pendingCount} musiker.`}
            </p>
          )}

          <div className="flex gap-2">
            {/* Show send button only when needed */}
            {!need.status.isFullyStaffed && need.needStatus !== 'paused' && (
              <>
                {/* First time sending */}
                {need.status.totalRequests === 0 && (
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Skickar...' : 'Skicka förfrågningar'}
                  </button>
                )}

                {/* First come: manual send when all responded */}
                {need.requestStrategy === 'first_come' && 
                 need.status.pendingCount === 0 && 
                 need.status.totalRequests > 0 && 
                 !need.status.isFullyStaffed && (
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Skickar...' : `Skicka till nästa ${need.maxRecipients || need.quantity} musiker`}
                  </button>
                )}
              </>
            )}
            
            {/* Complete button - show when fully staffed */}
            {need.status.isFullyStaffed && need.needStatus !== 'completed' && (
              <button
                onClick={async () => {
                  setUpdating(true)
                  try {
                    const response = await fetch(`/api/projects/${projectId}/needs/${need.id}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'completed' })
                    })
                    if (response.ok) onRequestsSent()
                  } catch (error) {
                    console.error('Error:', error)
                  } finally {
                    setUpdating(false)
                  }
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? '...' : 'Markera som slutfört'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Request List - More Compact */}
      {need.requests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Förfrågningar ({need.requests.length})
            </h4>
          </div>
          {/* Table Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div>Musiker</div>
              <div className="text-center">Status</div>
              <div>Email</div>
              <div className="text-right">Svarade</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {need.requests.map((request, index) => (
              <div key={request.id} className={`px-4 py-3 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <div className="grid grid-cols-4 gap-4 items-center">
                  {/* Musiker Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {request.musician.name}
                    </p>
                  </div>
                  
                  {/* Status Badge - Centered */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status === 'accepted' ? 'Accepterat' : 
                       request.status === 'pending' ? 'Väntar' : 'Avböjt'}
                    </span>
                  </div>
                  
                  {/* Email */}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 truncate">
                      {request.musician.email}
                    </p>
                  </div>
                  
                  {/* Response Date - Right Aligned */}
                  <div className="text-right">
                    {request.status === 'pending' ? (
                      <span className="text-xs text-orange-600">
                        Väntat {getTimeWaiting(request.sentAt)}
                      </span>
                    ) : request.respondedAt ? (
                      <span className="text-xs text-green-600">
                        {new Date(request.respondedAt).toLocaleDateString('sv-SE')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next in Queue - Simplified */}
      {need.nextInQueue && need.nextInQueue.length > 0 && !need.status.isFullyStaffed && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              {need.requestStrategy === 'sequential' && need.status.totalRequests === 0 
                ? 'Kommer kontaktas'
                : need.requestStrategy === 'sequential' 
                ? 'Nästa musiker' 
                : need.requestStrategy === 'parallel' 
                ? 'Nästa vid avböjande'
                : 'Återstående i kö'
              }
            </h4>
          </div>
          <div className="px-4 py-3">
            {/* Sequential first contact info */}
            {need.requestStrategy === 'sequential' && need.status.totalRequests === 0 && (
              <p className="text-xs text-gray-600 italic mb-2">
                Endast en musiker kontaktas åt gången
              </p>
            )}
            
            <div className="space-y-1">
              {need.nextInQueue.slice(0, 5).map((musician, idx) => (
                <div key={musician.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2 tabular-nums">{musician.rank}.</span>
                    {musician.name}
                  </span>
                  {idx === 0 && need.requestStrategy === 'sequential' && (
                    <span className="text-xs text-blue-600">Nästa</span>
                  )}
                </div>
              ))}
              {need.totalInQueue && need.totalInQueue > 5 && (
                <p className="text-xs text-gray-500 italic mt-2">
                  +{need.totalInQueue - 5} till
                </p>
              )}
            </div>
            
            {need.requestStrategy === 'first_come' && need.maxRecipients && (
              <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-100">
                Nästa utskick: {Math.min(need.maxRecipients, need.totalInQueue || 0)} musiker
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <SendRequestsPreviewModal
        projectId={projectId}
        needId={need.id}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleSendRequests}
      />
    </div>
  )
}