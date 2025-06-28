'use client'

import { useState, useEffect } from 'react'

interface Instrument {
  id: number
  name: string
}

interface Position {
  id: number
  name: string
  instrumentId: number
  instrument: Instrument
}

interface RankingList {
  id: number
  positionId: number
  listType: string
  description: string | null
}

interface AddProjectNeedModalProps {
  projectId: number
  onClose: () => void
  onSuccess: () => void
}

export default function AddProjectNeedModal({ projectId, onClose, onSuccess }: AddProjectNeedModalProps) {
  const [loading, setLoading] = useState(false)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [rankingLists, setRankingLists] = useState<RankingList[]>([])
  const [rankingListsLoading, setRankingListsLoading] = useState(false)
  const [formData, setFormData] = useState({
    instrumentId: '',
    positionId: '',
    rankingListId: '',
    quantity: '1',
    requestStrategy: 'sequential',
    maxRecipients: '',
    responseTimeHours: '24'
  })

  useEffect(() => {
    fetchInstruments()
  }, [])

  useEffect(() => {
    if (formData.instrumentId) {
      const filtered = positions.filter(p => p.instrumentId === parseInt(formData.instrumentId))
      if (filtered.length > 0 && !filtered.find(p => p.id === parseInt(formData.positionId))) {
        setFormData(prev => ({ ...prev, positionId: '', rankingListId: '' }))
      }
    }
  }, [formData.instrumentId, positions])

  useEffect(() => {
    if (formData.positionId) {
      setRankingListsLoading(true)
      fetchRankingLists(parseInt(formData.positionId))
    } else {
      setRankingLists([])
      setFormData(prev => ({ ...prev, rankingListId: '' }))
    }
  }, [formData.positionId])

  const fetchInstruments = async () => {
    try {
      const response = await fetch('/api/instruments')
      const data = await response.json()
      setInstruments(data)
    } catch (error) {
      console.error('Error fetching instruments:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions')
      const data = await response.json()
      setPositions(data)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchRankingLists = async (positionId: number) => {
    try {
      const response = await fetch(`/api/ranking-lists?positionId=${positionId}&projectId=${projectId}`)
      const data = await response.json()
      setRankingLists(data)
    } catch (error) {
      console.error('Error fetching ranking lists:', error)
    } finally {
      setRankingListsLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validera först till kvarn strategi
    if (formData.requestStrategy === 'first_come' && formData.maxRecipients) {
      const maxRec = parseInt(formData.maxRecipients)
      const qty = parseInt(formData.quantity)
      if (maxRec < qty) {
        alert(`Max antal mottagare måste vara minst ${qty} (antal behov)`)
        return
      }
    }
    
    setLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/needs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: formData.positionId,
          rankingListId: formData.rankingListId,
          quantity: formData.quantity,
          requestStrategy: formData.requestStrategy,
          maxRecipients: formData.maxRecipients || null,
          responseTimeHours: parseInt(formData.responseTimeHours)
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error creating need:', error)
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const filteredPositions = formData.instrumentId 
    ? positions.filter(p => p.instrumentId === parseInt(formData.instrumentId))
    : positions

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Lägg till musikerbehov</h3>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrument <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.instrumentId}
                onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Välj instrument</option>
                {instruments.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tjänst <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                disabled={!formData.instrumentId}
              >
                <option value="">Välj tjänst</option>
                {filteredPositions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rankningslista <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.rankingListId}
                onChange={(e) => setFormData({ ...formData, rankingListId: e.target.value })}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                disabled={!formData.positionId || rankingListsLoading}
              >
                <option value="">{rankingListsLoading ? 'Laddar rankningslistor...' : 'Välj rankningslista'}</option>
                {rankingLists.map((list: any) => (
                  <option 
                    key={list.id} 
                    value={list.id}
                    disabled={list.isUsedInProject}
                  >
                    {list.listType}-lista{list.description ? ` (${list.description})` : ''}{list.isUsedInProject ? ' (Redan använd)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => {
                  const newQuantity = e.target.value
                  // Om parallell är vald och antal blir 1, byt till sekventiell
                  if (formData.requestStrategy === 'parallel' && parseInt(newQuantity) === 1) {
                    setFormData({ 
                      ...formData, 
                      quantity: newQuantity,
                      requestStrategy: 'sequential'
                    })
                    alert('Bytte automatiskt till sekventiell strategi då parallell kräver minst 2 behov.')
                  } else {
                    setFormData({ ...formData, quantity: newQuantity })
                  }
                }}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Förfrågningsstrategi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.requestStrategy}
                onChange={(e) => {
                  const newStrategy = e.target.value
                  // Om parallell valts med endast 1 behov, byt automatiskt till sekventiell
                  if (newStrategy === 'parallel' && parseInt(formData.quantity) === 1) {
                    alert('Parallell strategi kräver minst 2 behov. Använd sekventiell för 1 behov.')
                    return
                  }
                  setFormData({ ...formData, requestStrategy: newStrategy })
                }}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="sequential">Sekventiell - Fråga en musiker i taget</option>
                <option value="parallel">Parallell - Håll aktiva förfrågningar = antal behov (minst 2)</option>
                <option value="first_come">Först till kvarn - Skicka till musiker samtidigt</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {formData.requestStrategy === 'sequential' && 'Frågar musiker i rankningsordning, väntar på svar innan nästa kontaktas'}
                {formData.requestStrategy === 'parallel' && `Håller alltid ${formData.quantity || 'X'} förfrågningar aktiva. När någon tackar nej skickas automatiskt till nästa på listan`}
                {formData.requestStrategy === 'first_come' && 'Skickar förfrågan till de första X musikerna på listan samtidigt'}
              </p>
            </div>

            {formData.requestStrategy === 'first_come' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max antal mottagare
                </label>
                <input
                  type="number"
                  min={formData.quantity || "1"}
                  value={formData.maxRecipients}
                  onChange={(e) => setFormData({ ...formData, maxRecipients: e.target.value })}
                  className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
                  placeholder="Lämna tomt för hela listan"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Hur många musiker som får förfrågan från toppen av listan. Lämna tomt för att fråga hela listan. Om angivet måste vara minst {formData.quantity || '1'}.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Svarstid <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.responseTimeHours}
                onChange={(e) => setFormData({ ...formData, responseTimeHours: e.target.value })}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              <p className="mt-2 text-xs text-gray-500">
                Hur länge musiker har på sig att svara innan förfrågan automatiskt upphör
              </p>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Lägger till...' : 'Lägg till'}
          </button>
        </div>
      </div>
    </div>
  )
}