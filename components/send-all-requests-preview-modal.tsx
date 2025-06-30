'use client'

import { useState, useEffect } from 'react'
import Tooltip from './tooltip'
import ConflictWarning from './conflict-warning'
import RankingListTooltip from './ranking-list-tooltip'

interface MusicianInfo {
  id: number
  name: string
  email: string
  rank: number
  isExcluded?: boolean
  excludeReason?: 'already_contacted' | 'has_pending' | 'has_accepted' | 'has_declined' | 'timed_out' | 'no_local_residence' | 'inactive' | 'will_receive_request'
  existingPosition?: string
  existingStatus?: string
}

interface NeedPreview {
  needId: number
  position: string
  quantity: number
  currentStatus: {
    accepted: number
    pending: number
    remaining: number
  }
  strategy: string
  maxRecipients?: number | null
  listType?: string
  rankingListId?: number
  musiciansToContact: MusicianInfo[]
  nextInQueue?: MusicianInfo[]
  allMusiciansWithStatus?: MusicianInfo[]
  totalAvailable?: number
}

interface PreviewData {
  project: {
    name: string
    totalNeeds: number
  }
  needsPreviews: NeedPreview[]
  totalToSend: number
  canSend: boolean
}

interface SendAllRequestsPreviewModalProps {
  projectId: number
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function SendAllRequestsPreviewModal({
  projectId,
  isOpen,
  onClose,
  onConfirm
}: SendAllRequestsPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState('simple')
  const [expandedNeeds, setExpandedNeeds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchPreview()
      fetchSettings()
    }
  }, [isOpen])

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/preview-all-requests`)
      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
      } else {
        console.error('Failed to fetch preview')
      }
    } catch (error) {
      console.error('Error fetching preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        const strategySetting = settings.find((s: any) => s.key === 'ranking_conflict_strategy')
        if (strategySetting) {
          setConflictStrategy(strategySetting.value)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const toggleNeedExpansion = (needId: number) => {
    const newExpanded = new Set(expandedNeeds)
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId)
    } else {
      newExpanded.add(needId)
    }
    setExpandedNeeds(newExpanded)
  }

  if (!isOpen) return null

  const getStrategyLabel = (type: string) => {
    switch (type) {
      case 'sequential': return 'Sekventiell'
      case 'parallel': return 'Parallell'
      case 'first_come': return 'Först till kvarn'
      default: return type
    }
  }

  const getExcludeReasonText = (reason: string | undefined, existingPosition?: string) => {
    switch (reason) {
      case 'has_pending':
        return existingPosition ? `Väntar svar - ${existingPosition}` : 'Väntar svar'
      case 'has_accepted':
        return existingPosition ? `Redan accepterat - ${existingPosition}` : 'Redan accepterat'
      case 'has_declined':
        return 'Tackade nej'
      case 'timed_out':
        return 'Svarstid utgått'
      case 'no_local_residence':
        return 'Saknar lokalt boende'
      case 'inactive':
        return 'Inaktiv musiker'
      case 'will_receive_request':
        return existingPosition ? `Får förfrågan - ${existingPosition}` : 'Får förfrågan'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto border w-11/12 max-w-4xl shadow-lg rounded-md bg-white flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Bekräfta utskick av förfrågningar - Alla behov
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Förbereder förhandsgranskning...</p>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  {previewData.totalToSend} förfrågningar kommer skickas ut för {previewData.needsPreviews.length} behov
                </p>
              </div>

              {/* Conflict warning */}
              <ConflictWarning projectId={projectId} />

              {/* Conflict strategy info */}
              {conflictStrategy === 'smart' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900">
                        Smart position-matchning aktiv
                      </h4>
                      <p className="text-xs text-green-800 mt-1">
                        Systemet kommer automatiskt att prioritera musiker för de positioner där de rankas högst. 
                        Musiker som passar bättre för andra positioner kommer att sparas för dessa.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Needs breakdown */}
            {previewData.needsPreviews.length > 0 ? (
              <div className="space-y-3">
                {previewData.needsPreviews.map((need) => (
                  <div key={need.needId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Need Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{need.position}</h4>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                            <Tooltip
                              content={
                                need.rankingListId ? (
                                  <RankingListTooltip
                                    rankingListId={need.rankingListId}
                                    listType={need.listType || ''}
                                    positionName={need.position.split(' - ')[1] || ''}
                                  />
                                ) : (
                                  <div className="text-xs">
                                    Rankningslista {need.listType}
                                  </div>
                                )
                              }
                              delay={700}
                            >
                              <span className="cursor-help border-b border-dashed border-gray-400">
                                Lista {need.listType}
                              </span>
                            </Tooltip>
                            <span>•</span>
                            <Tooltip
                              content={
                                <div className="text-xs">
                                  {need.strategy === 'sequential' && 'En musiker i taget, nästa vid nej'}
                                  {need.strategy === 'parallel' && 'Flera samtidigt för att fylla behoven'}
                                  {need.strategy === 'first_come' && 'Alla får förfrågan, först till kvarn'}
                                </div>
                              }
                              delay={300}
                            >
                              <span className="cursor-help border-b border-dashed border-gray-400">
                                {getStrategyLabel(need.strategy)}
                              </span>
                            </Tooltip>
                            {need.strategy === 'first_come' && (
                              <>
                                <span>•</span>
                                <span>
                                  {need.maxRecipients && need.maxRecipients > 0 
                                    ? `Max ${need.maxRecipients} mottagare`
                                    : 'Alla på listan'
                                  }
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{need.currentStatus.accepted}/{need.quantity} bemannat</span>
                            {need.currentStatus.pending > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-yellow-600">{need.currentStatus.pending} väntar</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            {need.musiciansToContact.length}
                          </span>
                          <p className="text-xs text-gray-500">förfrågningar</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Musicians to Contact */}
                    <div className="px-4 py-3">
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {need.musiciansToContact.map((musician) => (
                          <div key={musician.id} className="flex items-center text-sm">
                            <span className="text-gray-400 w-8">{musician.rank}.</span>
                            <span className="text-gray-700">{musician.name}</span>
                            {need.strategy === 'sequential' && musician.rank === need.musiciansToContact[0].rank && (
                              <span className="ml-2 text-xs text-green-600">
                                (Kontaktas först)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expandable section for all musicians */}
                    {need.allMusiciansWithStatus && need.allMusiciansWithStatus.length > 0 && (
                      <div className="px-4 pb-3">
                        <button
                          onClick={() => toggleNeedExpansion(need.needId)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg 
                            className={`w-3 h-3 mr-1 transform transition-transform ${expandedNeeds.has(need.needId) ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {expandedNeeds.has(need.needId) ? 'Dölj' : 'Visa'} alla musiker på listan
                        </button>
                        
                        {expandedNeeds.has(need.needId) && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                            <div className="space-y-1 text-xs">
                              {need.allMusiciansWithStatus.map((musician) => {
                                const willContact = need.musiciansToContact.some(m => m.id === musician.id)
                                
                                return (
                                  <div key={musician.id} className={`flex items-center ${musician.isExcluded ? 'text-gray-400' : ''}`}>
                                    <span className="w-6 text-right mr-2">{musician.rank}.</span>
                                    
                                    {/* Status icon */}
                                    {musician.isExcluded ? (
                                      <>
                                        {musician.excludeReason === 'has_accepted' && (
                                          <span className="text-green-600 mr-1" title="Redan accepterat">✓</span>
                                        )}
                                        {musician.excludeReason === 'has_pending' && (
                                          <span className="text-yellow-500 mr-1" title="Väntar på svar">⏱</span>
                                        )}
                                        {(musician.excludeReason === 'has_declined' || musician.excludeReason === 'timed_out') && (
                                          <span className="text-red-500 mr-1" title="Tackade nej">✗</span>
                                        )}
                                        {musician.excludeReason === 'inactive' && (
                                          <span className="text-gray-400 mr-1" title="Inaktiv">○</span>
                                        )}
                                        {musician.excludeReason === 'no_local_residence' && (
                                          <span className="text-orange-500 mr-1" title="Saknar lokalt boende">⚠</span>
                                        )}
                                        {musician.excludeReason === 'will_receive_request' && (
                                          <span className="text-blue-500 mr-1" title="Får förfrågan">➔</span>
                                        )}
                                      </>
                                    ) : willContact ? (
                                      <span className="text-green-600 mr-1" title="Kommer få förfrågan">→</span>
                                    ) : (
                                      <span className="mr-3"></span>
                                    )}
                                    
                                    <span className={`${musician.isExcluded ? 'line-through' : ''}`}>
                                      {musician.name}
                                    </span>
                                    
                                    {musician.isExcluded && musician.excludeReason && (
                                      <span className="ml-2 text-gray-500">
                                        ({getExcludeReasonText(musician.excludeReason, musician.existingPosition)})
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next in Queue */}
                    {need.nextInQueue && need.nextInQueue.length > 0 && (
                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                        <div className="flex items-center text-xs">
                          <span className="text-gray-600 font-medium">
                            {need.strategy === 'first_come' ? 'Övriga musiker:' : 'Näst på tur:'}
                          </span>
                          <Tooltip
                            content={
                              <div className="w-48 space-y-1">
                                {need.nextInQueue.map((musician) => (
                                  <div key={musician.id} className="text-xs">
                                    <span className="opacity-70 mr-2">{musician.rank}.</span>
                                    {musician.name}
                                  </div>
                                ))}
                                {need.totalAvailable && need.totalAvailable > need.musiciansToContact.length + need.nextInQueue.length && (
                                  <div className="text-xs opacity-70 italic pt-1 border-t border-gray-600">
                                    ... och {need.totalAvailable - need.musiciansToContact.length - need.nextInQueue.length} till
                                  </div>
                                )}
                              </div>
                            }
                            delay={500}
                          >
                            <span className="ml-2 text-blue-600 cursor-help border-b border-dashed border-blue-400">
                              {need.nextInQueue.length} musiker
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Inga förfrågningar behöver skickas just nu. Alla behov är antingen fullbemannade eller väntar på svar.
                </p>
              </div>
            )}

            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Kunde inte ladda förhandsgranskning
            </p>
          )}
        </div>

        {/* Fixed Footer with Buttons */}
        {!loading && previewData && (
          <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              onClick={async () => {
                setSending(true)
                try {
                  await onConfirm()
                  onClose()
                } finally {
                  setSending(false)
                }
              }}
              disabled={!previewData.canSend || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {sending && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{sending ? 'Skickar...' : 'Skicka alla förfrågningar'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}