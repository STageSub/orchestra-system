'use client'

import { useState, useEffect } from 'react'
import ResponseTimeSelectorNested from './response-time-selector-nested'
import CreateCustomListModal from './create-custom-list-modal'

interface Instrument {
  id: number
  name: string
}

interface Position {
  id: number
  name: string
  instrumentId: number
  instrument: Instrument
  qualifiedMusiciansCount?: number
}

interface RankingList {
  id: number
  positionId: number
  listType: string
  description: string | null
  availableMusiciansCount?: number
  totalActiveMusicians?: number
  isUsedInProject?: boolean
  isCustomList?: boolean
  customListId?: number
}

interface AddProjectNeedModalProps {
  projectId: number
  onClose: () => void
  onSuccess: () => void
  customRankingListId?: number
  prefilledPositionId?: number
}

export default function AddProjectNeedModal({ 
  projectId, 
  onClose, 
  onSuccess, 
  customRankingListId,
  prefilledPositionId 
}: AddProjectNeedModalProps) {
  const [loading, setLoading] = useState(false)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [instrumentsLoading, setInstrumentsLoading] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [rankingLists, setRankingLists] = useState<RankingList[]>([])
  const [rankingListsLoading, setRankingListsLoading] = useState(false)
  const [validationWarning, setValidationWarning] = useState('')
  const [customList, setCustomList] = useState<any>(null)
  const [showCreateCustomListModal, setShowCreateCustomListModal] = useState(false)
  const [existingCustomListForPosition, setExistingCustomListForPosition] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    instrumentId: '',
    positionId: prefilledPositionId ? prefilledPositionId.toString() : '',
    rankingListId: '',
    customRankingListId: customRankingListId ? customRankingListId.toString() : '',
    quantity: '1',
    requestStrategy: '',
    maxRecipients: '',
    responseTimeHours: '',
    requireLocalResidence: false
  })

  useEffect(() => {
    fetchInstruments()
  }, [])

  // Fetch custom list if provided
  useEffect(() => {
    if (customRankingListId) {
      fetchCustomList()
    }
  }, [customRankingListId])

  const fetchCustomList = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/custom-lists?customListId=${customRankingListId}`
      )
      if (response.ok) {
        const data = await response.json()
        setCustomList(data)
        // Pre-fill position based on custom list
        if (data.positionId) {
          setFormData(prev => ({ 
            ...prev, 
            positionId: data.positionId.toString(),
            instrumentId: data.position?.instrumentId?.toString() || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching custom list:', error)
    }
  }

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
  
  // Check validation when quantity or ranking list changes
  useEffect(() => {
    if (customList) {
      const availableCount = customList.customRankings?.filter((r: any) => 
        r.musician.isActive && !r.musician.isArchived
      ).length || 0
      const quantity = parseInt(formData.quantity)
      if (quantity > availableCount) {
        setValidationWarning(`Antal behov (${quantity}) är högre än tillgängliga musiker (${availableCount})`)
      } else {
        setValidationWarning('')
      }
    } else if (formData.rankingListId) {
      const selectedList = rankingLists.find(l => l.id === parseInt(formData.rankingListId))
      if (selectedList && selectedList.availableMusiciansCount !== undefined) {
        const quantity = parseInt(formData.quantity)
        if (quantity > selectedList.availableMusiciansCount) {
          setValidationWarning(`Antal behov (${quantity}) är högre än tillgängliga musiker (${selectedList.availableMusiciansCount})`)
        } else {
          setValidationWarning('')
        }
      }
    }
  }, [formData.quantity, formData.rankingListId, rankingLists, customList])

  const fetchInstruments = async () => {
    setInstrumentsLoading(true)
    try {
      const response = await fetch('/api/instruments?includeMusiciansCount=true')
      const data = await response.json()
      setInstruments(data)
    } catch (error) {
      console.error('Error fetching instruments:', error)
    } finally {
      setInstrumentsLoading(false)
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
      
      // Check if there's an existing custom list for this position
      const customList = data.find((list: any) => list.isCustomList)
      if (customList) {
        setExistingCustomListForPosition(customList.customListId || customList.id)
      } else {
        setExistingCustomListForPosition(null)
      }
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
      // Check if the selected ranking list is actually a custom list
      const selectedList = rankingLists.find(l => l.id === parseInt(formData.rankingListId))
      const isCustomListFromDropdown = selectedList?.isCustomList || false
      
      const response = await fetch(`/api/projects/${projectId}/needs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: formData.positionId,
          rankingListId: (formData.customRankingListId || isCustomListFromDropdown) ? null : formData.rankingListId,
          customRankingListId: formData.customRankingListId || (isCustomListFromDropdown ? formData.rankingListId : null),
          quantity: formData.quantity,
          requestStrategy: formData.requestStrategy,
          maxRecipients: formData.maxRecipients || null,
          responseTimeHours: parseInt(formData.responseTimeHours),
          requireLocalResidence: formData.requireLocalResidence
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full min-h-[600px] flex flex-col transform transition-all duration-200 ease-out">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Lägg till musikerbehov</h3>
        </div>
        
        <div className="p-6 overflow-visible flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrument <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.instrumentId}
                onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                disabled={instrumentsLoading}
              >
                <option value="">{instrumentsLoading ? 'Laddar instrument...' : 'Välj instrument'}</option>
                {instruments.map((instrument: any) => (
                  <option 
                    key={instrument.id} 
                    value={instrument.id}
                    disabled={instrument.totalUniqueMusicians === 0}
                  >
                    {instrument.name} ({instrument.totalUniqueMusicians} musiker)
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
                  <option 
                    key={position.id} 
                    value={position.id}
                    disabled={position.qualifiedMusiciansCount === 0}
                  >
                    {position.name} {position.qualifiedMusiciansCount !== undefined && `(${position.qualifiedMusiciansCount} musiker)`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rankningslista <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                {customList ? (
                  <div className="flex-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg">
                    <span className="text-sm font-medium text-green-800">
                      Anpassad lista: {customList.name} ({customList.customRankings?.length || 0} musiker)
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.rankingListId}
                    onChange={(e) => setFormData({ ...formData, rankingListId: e.target.value })}
                    className="flex-1 h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!formData.positionId || rankingListsLoading}
                  >
                    <option value="">{rankingListsLoading ? 'Laddar rankningslistor...' : 'Välj rankningslista'}</option>
                    {rankingLists.map((list: any) => (
                      <option 
                        key={list.id} 
                        value={list.id}
                        disabled={list.isUsedInProject || (list.availableMusiciansCount !== undefined && list.availableMusiciansCount === 0)}
                      >
                        {list.isCustomList ? 
                          `Anpassad: ${list.description}` : 
                          `${list.listType}-lista${list.description ? ` (${list.description})` : ''}`
                        }
                        {list.availableMusiciansCount !== undefined && ` (${list.availableMusiciansCount} tillgängliga)`}
                        {list.isUsedInProject ? ' (Redan använd)' : ''}
                        {list.availableMusiciansCount === 0 ? ' (Inga tillgängliga)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {formData.positionId && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCustomListModal(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    {(existingCustomListForPosition && 
                     (formData.rankingListId === existingCustomListForPosition.toString() || 
                      customList)) ? 'Ändra befintlig lista' : 'Skapa ny lista'}
                  </button>
                )}
              </div>
              {validationWarning && (
                <p className="mt-2 text-sm text-red-600">{validationWarning}</p>
              )}
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
                  // Adjust quantity based on strategy
                  if (newStrategy === 'sequential') {
                    setFormData({ 
                      ...formData, 
                      requestStrategy: newStrategy,
                      quantity: '1'
                    })
                  } else if (newStrategy === 'parallel') {
                    setFormData({ 
                      ...formData, 
                      requestStrategy: newStrategy,
                      quantity: '2'
                    })
                  } else if (newStrategy === 'first_come') {
                    setFormData({ 
                      ...formData, 
                      requestStrategy: newStrategy,
                      quantity: '1'
                    })
                  } else {
                    setFormData({ ...formData, requestStrategy: newStrategy })
                  }
                }}
                className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                disabled={!formData.rankingListId && !formData.customRankingListId && !customList}
              >
                <option value="">Välj strategi</option>
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

            {formData.requestStrategy && formData.requestStrategy !== 'first_come' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Behov <span className="text-red-500">*</span>
                  </label>
                  {formData.requestStrategy === 'sequential' ? (
                    <select
                      required
                      value={formData.quantity}
                      disabled
                      className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    >
                      <option value="1">1 musiker</option>
                    </select>
                  ) : (
                    <select
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:bg-gray-50"
                    >
                      {formData.requestStrategy === 'parallel' ? (
                        Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                          <option key={num} value={num}>{num} musiker</option>
                        ))
                      ) : (
                        Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'musiker' : 'musiker'}</option>
                        ))
                      )}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Svarstid <span className="text-red-500">*</span>
                  </label>
                  <ResponseTimeSelectorNested
                    value={formData.responseTimeHours}
                    onChange={(hours) => setFormData({ ...formData, responseTimeHours: hours })}
                    disabled={false}
                    required={true}
                    simple={true}
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requireLocalResidence}
                      onChange={(e) => setFormData({ ...formData, requireLocalResidence: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Kräv lokalt boende</span>
                  </label>
                </div>
              </div>
            )}

            {formData.requestStrategy === 'first_come' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Behov <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:bg-gray-50"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'musiker' : 'musiker'}</option>
                      ))}
                    </select>
                  </div>
                  
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
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Svarstid <span className="text-red-500">*</span>
                  </label>
                  <ResponseTimeSelectorNested
                    value={formData.responseTimeHours}
                    onChange={(hours) => setFormData({ ...formData, responseTimeHours: hours })}
                    disabled={false}
                    required={true}
                    simple={true}
                  />
                </div>
                  
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requireLocalResidence}
                      onChange={(e) => setFormData({ ...formData, requireLocalResidence: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Kräv lokalt boende</span>
                  </label>
                </div>
              </div>
            )}

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
            disabled={loading || !!validationWarning}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Lägger till...' : 'Lägg till'}
          </button>
        </div>
      </div>
      
      {/* Create Custom List Modal */}
      {showCreateCustomListModal && formData.positionId && (
        <CreateCustomListModal
          projectId={projectId}
          positionId={parseInt(formData.positionId)}
          positionName={positions.find(p => p.id === parseInt(formData.positionId))?.name || ''}
          instrumentName={instruments.find(i => i.id === parseInt(formData.instrumentId))?.name || ''}
          existingCustomListId={existingCustomListForPosition || undefined}
          onClose={() => setShowCreateCustomListModal(false)}
          onSuccess={(customListId) => {
            setShowCreateCustomListModal(false)
            // Refresh ranking lists to include the new custom list
            fetchRankingLists(parseInt(formData.positionId))
            // Select the custom list
            setFormData(prev => ({ 
              ...prev, 
              rankingListId: customListId.toString(),
              customRankingListId: customListId.toString()
            }))
            setCustomList({ id: customListId })
          }}
        />
      )}
    </div>
  )
}