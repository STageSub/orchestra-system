'use client'

import { useState, useEffect } from 'react'

interface RequestSummary {
  strategy: string
  maxRecipients: number | null
  quantity: number
  accepted: number
  pending: number
  declined: number
  timedOut: number
  activeRequests: Array<{
    id: number
    musician: string
    sentAt: string
  }>
  acceptedRequests: Array<{
    id: number
    musician: string
    respondedAt: string
  }>
  declinedRequests: Array<{
    id: number
    musician: string
    respondedAt: string
  }>
  timedOutRequests: Array<{
    id: number
    musician: string
    timedOutAt: string
  }>
  nextInQueue: Array<{
    id: string
    name: string
    rank: number
  }>
  totalInQueue: number
}

interface RequestSummaryTooltipProps {
  projectId: number
  needId: number
  strategy: string
}

export default function RequestSummaryTooltip({ projectId, needId, strategy }: RequestSummaryTooltipProps) {
  const [summary, setSummary] = useState<RequestSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/needs/${needId}/requests/summary`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data)
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [projectId, needId])

  if (loading) {
    return <div className="text-gray-400">Laddar...</div>
  }

  if (!summary) {
    return <div className="text-gray-400">Kunde inte ladda information</div>
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'sequential': return 'Sekventiell'
      case 'parallel': return 'Parallell'
      case 'first_come': return 'Först till kvarn'
      default: return strategy
    }
  }

  return (
    <div className="w-64 max-h-80 overflow-y-auto">
      <div className="font-semibold mb-2 pb-2 border-b border-gray-600">
        {getStrategyLabel(summary.strategy)} förfrågan
      </div>
      
      <div className="text-xs mb-3">
        Status: {summary.accepted}/{summary.quantity} bemannat
      </div>

      {/* Active requests */}
      {summary.activeRequests.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-yellow-300 mb-1">Väntar svar:</div>
          <div className="space-y-0.5">
            {summary.activeRequests.slice(0, 3).map((req, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-yellow-300 mr-1">⏳</span>
                <span>{req.musician}</span>
              </div>
            ))}
            {summary.activeRequests.length > 3 && (
              <div className="text-gray-400 italic">
                ... och {summary.activeRequests.length - 3} till
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accepted requests */}
      {summary.acceptedRequests.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-green-300 mb-1">Accepterat:</div>
          <div className="space-y-0.5">
            {summary.acceptedRequests.slice(0, 2).map((req, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-green-300 mr-1">✓</span>
                <span>{req.musician}</span>
              </div>
            ))}
            {summary.acceptedRequests.length > 2 && (
              <div className="text-gray-400 italic">
                ... och {summary.acceptedRequests.length - 2} till
              </div>
            )}
          </div>
        </div>
      )}

      {/* Declined requests */}
      {summary.declinedRequests.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-red-300 mb-1">Avböjt:</div>
          <div className="space-y-0.5">
            {summary.declinedRequests.slice(0, 3).map((req, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-red-300 mr-1">✗</span>
                <span>{req.musician}</span>
              </div>
            ))}
            {summary.declinedRequests.length > 3 && (
              <div className="text-gray-400 italic">
                ... och {summary.declinedRequests.length - 3} till
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timed out requests */}
      {summary.timedOutRequests.length > 0 && (
        <div className="mb-3">
          <div className="font-medium text-gray-400 mb-1">Tidsgräns passerad:</div>
          <div className="space-y-0.5">
            {summary.timedOutRequests.slice(0, 3).map((req, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-gray-400 mr-1">⏱</span>
                <span className="text-gray-300">{req.musician}</span>
              </div>
            ))}
            {summary.timedOutRequests.length > 3 && (
              <div className="text-gray-400 italic">
                ... och {summary.timedOutRequests.length - 3} till
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next in queue */}
      {summary.nextInQueue.length > 0 && summary.accepted < summary.quantity && (
        <div className="pt-2 border-t border-gray-600">
          <div className="font-medium text-blue-300 mb-1">Nästa i kö:</div>
          <div className="text-sm">
            {summary.nextInQueue.slice(0, 3).map((m, idx) => (
              <span key={m.id}>
                {idx > 0 && ', '}
                {m.name}
              </span>
            ))}
            {summary.totalInQueue > 3 && (
              <span className="text-gray-400 italic">
                ... och {summary.totalInQueue - 3} till
              </span>
            )}
          </div>
        </div>
      )}

      {/* Special info for first_come */}
      {summary.strategy === 'first_come' && summary.maxRecipients && (
        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-300">
          Max {summary.maxRecipients} förfrågningar åt gången
        </div>
      )}
    </div>
  )
}