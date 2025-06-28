'use client'

import { useState, useEffect } from 'react'

interface ProjectNeed {
  id: number
  projectNeedId: string
  quantity: number
  requestStrategy: string
  maxRecipients: number | null
  responseTimeHours: number | null
  position: {
    id: number
    name: string
    instrument: {
      name: string
    }
  }
  rankingList: {
    id: number
    listType: string
  }
  _count?: {
    requests: number
  }
}

interface EditProjectNeedModalProps {
  projectId: number
  needId: number
  onClose: () => void
  onSuccess: () => void
}

export default function EditProjectNeedModal({
  projectId,
  needId,
  onClose,
  onSuccess
}: EditProjectNeedModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [need, setNeed] = useState<ProjectNeed | null>(null)
  const [formData, setFormData] = useState({
    quantity: 1,
    responseTimeHours: 24,
    maxRecipients: null as number | null
  })
  const [requestCounts, setRequestCounts] = useState({
    accepted: 0,
    pending: 0,
    declined: 0
  })

  useEffect(() => {
    fetchNeedData()
  }, [needId])

  const fetchNeedData = async () => {
    try {
      // Fetch need details
      const needResponse = await fetch(`/api/projects/${projectId}/needs/${needId}`)
      if (!needResponse.ok) throw new Error('Failed to fetch need')
      const needData = await needResponse.json()
      setNeed(needData)
      
      setFormData({
        quantity: needData.quantity,
        responseTimeHours: needData.responseTimeHours || 24,
        maxRecipients: needData.maxRecipients
      })

      // Fetch request counts
      const requestsResponse = await fetch(`/api/projects/${projectId}/requests`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        const needRequests = requestsData.needs.find((n: any) => n.id === needId)
        if (needRequests) {
          setRequestCounts({
            accepted: needRequests.status.acceptedCount,
            pending: needRequests.status.pendingCount,
            declined: needRequests.status.declinedCount
          })
        }
      }
    } catch (error) {
      console.error('Error fetching need data:', error)
      alert('Kunde inte hämta behovsdata')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.quantity < requestCounts.accepted) {
      alert(`Du kan inte minska antalet under ${requestCounts.accepted} eftersom så många redan accepterat.`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/needs/${needId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: formData.quantity,
          maxRecipients: formData.maxRecipients || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update need')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating need:', error)
      alert(error instanceof Error ? error.message : 'Kunde inte uppdatera behov')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p>Laddar...</p>
        </div>
      </div>
    )
  }

  if (!need) return null

  const hasRequests = (need._count?.requests || 0) > 0
  const canIncreaseQuantity = true
  const canDecreaseQuantity = formData.quantity > requestCounts.accepted
  const hasIncreasedQuantity = formData.quantity > need.quantity

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Redigera musikerbehov</h2>
        
        {/* Display current need info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Position:</strong> {need.position.instrument.name} - {need.position.name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Lista:</strong> {need.rankingList.listType}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Strategi:</strong> {
              need.requestStrategy === 'sequential' ? 'Sekventiell' :
              need.requestStrategy === 'parallel' ? 'Parallell' :
              'Först till kvarn'
            }
          </p>
          {hasRequests && (
            <p className="text-sm text-gray-700 mt-2">
              <strong>Status:</strong> {requestCounts.accepted} accepterade, {requestCounts.pending} väntar, {requestCounts.declined} avböjde
            </p>
          )}
        </div>

        {/* Warning about locked fields */}
        {hasRequests && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>OBS:</strong> Eftersom förfrågningar redan skickats kan endast vissa fält ändras.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Antal musiker
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                disabled={!canDecreaseQuantity}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                min={requestCounts.accepted || 1}
                className="w-20 text-center border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                +
              </button>
            </div>
            {requestCounts.accepted > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Minst {requestCounts.accepted} krävs (redan accepterat)
              </p>
            )}
            {hasIncreasedQuantity && (
              <p className="mt-1 text-xs text-green-600">
                Du har ökat antalet. Efter sparande kan du skicka fler förfrågningar.
              </p>
            )}
          </div>

          {/* Response time (locked if requests sent) */}
          <div>
            <label htmlFor="responseTime" className="block text-sm font-medium text-gray-700">
              Svarstid
            </label>
            <select
              id="responseTime"
              value={formData.responseTimeHours}
              disabled={hasRequests}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
            >
              <option value="0.017">1 minut (test)</option>
              <option value="3">3 timmar</option>
              <option value="12">12 timmar</option>
              <option value="24">24 timmar</option>
              <option value="48">48 timmar</option>
              <option value="168">7 dagar</option>
              <option value="336">14 dagar</option>
              <option value="720">30 dagar</option>
            </select>
            {hasRequests && (
              <p className="mt-1 text-xs text-gray-500">Kan inte ändras efter att förfrågningar skickats</p>
            )}
          </div>

          {/* Max recipients (for first_come strategy) */}
          {need.requestStrategy === 'first_come' && (
            <div>
              <label htmlFor="maxRecipients" className="block text-sm font-medium text-gray-700">
                Max antal mottagare (för först till kvarn)
              </label>
              <input
                type="number"
                id="maxRecipients"
                value={formData.maxRecipients || ''}
                onChange={(e) => setFormData({ ...formData, maxRecipients: e.target.value ? parseInt(e.target.value) : null })}
                min={formData.quantity}
                disabled={hasRequests && formData.maxRecipients !== null && (formData.maxRecipients || 0) < requestCounts.pending}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
              />
              {hasRequests && (
                <p className="mt-1 text-xs text-gray-500">
                  Kan endast ökas eller lämnas tom
                </p>
              )}
            </div>
          )}

          {/* Locked fields info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">Låsta fält (kan inte ändras):</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Position och instrument</li>
              <li>• Rankinglista</li>
              <li>• Strategi</li>
              {hasRequests && <li>• Svarstid</li>}
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}