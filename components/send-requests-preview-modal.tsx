'use client'

import { useState, useEffect } from 'react'
import Tooltip from './tooltip'
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

interface PreviewData {
  need: {
    position: string
    quantity: number
    currentStatus: {
      accepted: number
      pending: number
      remaining: number
    }
  }
  strategy: {
    type: string
    explanation: string
  }
  preview: {
    musiciansToContact: MusicianInfo[]
    nextInQueue: MusicianInfo[]
    allMusiciansWithStatus: MusicianInfo[]
    totalAvailable: number
    listType?: string
    rankingListId?: number
    customRankingListId?: number
  }
  canSend: boolean
}

interface SendRequestsPreviewModalProps {
  projectId: number
  needId: number
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function SendRequestsPreviewModal({
  projectId,
  needId,
  isOpen,
  onClose,
  onConfirm
}: SendRequestsPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  useEffect(() => {
    if (isOpen && needId) {
      fetchPreview()
    }
  }, [isOpen, needId])

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/needs/${needId}/preview-requests`)
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
      <div className="relative top-20 mx-auto border w-11/12 max-w-2xl shadow-lg rounded-md bg-white flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Bekräfta utskick av förfrågningar
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
            <div className="space-y-6">
            {/* Position and status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{previewData.need.position}</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Status: {previewData.need.currentStatus.accepted}/{previewData.need.quantity} bemannat
                </span>
                {previewData.need.currentStatus.pending > 0 && (
                  <span className="text-yellow-600">
                    {previewData.need.currentStatus.pending} väntar svar
                  </span>
                )}
              </div>
            </div>

            {/* Compact strategy info */}
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
              <Tooltip
                content={
                  previewData.preview.rankingListId ? (
                    <RankingListTooltip
                      rankingListId={previewData.preview.rankingListId}
                      listType={previewData.preview.listType || ''}
                      positionName={previewData.need.position.split(' - ')[1] || ''}
                    />
                  ) : previewData.preview.customRankingListId ? (
                    <div className="text-xs">
                      Anpassad lista: {previewData.preview.listType}
                    </div>
                  ) : (
                    <div className="text-xs">
                      Rankningslista {previewData.preview.listType}
                    </div>
                  )
                }
                delay={700}
              >
                <span className="font-medium cursor-help border-b border-dashed border-gray-400">
                  {previewData.preview.customRankingListId ? 
                    previewData.preview.listType : 
                    `Lista ${previewData.preview.listType}`
                  }
                </span>
              </Tooltip>
              <span className="mx-1">•</span>
              <Tooltip
                content={
                  <div className="text-xs">
                    {previewData.strategy.type === 'sequential' && 'En musiker i taget, nästa vid nej'}
                    {previewData.strategy.type === 'parallel' && 'Flera samtidigt för att fylla behoven'}
                    {previewData.strategy.type === 'first_come' && 'Alla får förfrågan, först till kvarn'}
                  </div>
                }
                delay={300}
              >
                <span className="font-medium cursor-help border-b border-dashed border-gray-400">
                  {getStrategyLabel(previewData.strategy.type)}
                </span>
              </Tooltip>
            </div>

            {/* All musicians with status */}
            {previewData.preview.allMusiciansWithStatus && previewData.preview.allMusiciansWithStatus.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Alla musiker på rankningslistan ({previewData.preview.customRankingListId ? 
                    previewData.preview.listType : 
                    `Lista ${previewData.preview.listType}`
                  }):
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {previewData.preview.allMusiciansWithStatus.map((musician) => {
                      const willContact = previewData.preview.musiciansToContact.some(m => m.id === musician.id)
                      
                      return (
                        <div key={musician.id} className={`flex items-center justify-between text-sm p-2 rounded ${
                          musician.isExcluded ? 'bg-gray-100 text-gray-500' : 
                          willContact ? 'bg-green-50 text-green-900' : ''
                        }`}>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2 w-6 text-right">{musician.rank}.</span>
                            
                            {/* Status icon */}
                            {musician.isExcluded ? (
                              <>
                                {musician.excludeReason === 'has_accepted' && (
                                  <span className="text-green-600 mr-2" title="Redan accepterat">✓</span>
                                )}
                                {musician.excludeReason === 'has_pending' && (
                                  <span className="text-yellow-500 mr-2" title="Väntar på svar">⏱</span>
                                )}
                                {(musician.excludeReason === 'has_declined' || musician.excludeReason === 'timed_out') && (
                                  <span className="text-red-500 mr-2" title="Tackade nej">✗</span>
                                )}
                                {musician.excludeReason === 'inactive' && (
                                  <span className="text-gray-400 mr-2" title="Inaktiv">○</span>
                                )}
                                {musician.excludeReason === 'no_local_residence' && (
                                  <span className="text-orange-500 mr-2" title="Saknar lokalt boende">⚠</span>
                                )}
                                {musician.excludeReason === 'will_receive_request' && (
                                  <span className="text-blue-500 mr-2" title="Får förfrågan">➔</span>
                                )}
                              </>
                            ) : willContact ? (
                              <span className="text-green-600 mr-2" title="Kommer få förfrågan">→</span>
                            ) : (
                              <span className="mr-4"></span>
                            )}
                            
                            <span className={`font-medium ${musician.isExcluded ? 'line-through' : ''}`}>
                              {musician.name}
                            </span>
                            
                            {musician.isExcluded && musician.excludeReason && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({getExcludeReasonText(musician.excludeReason, musician.existingPosition)})
                              </span>
                            )}
                          </div>
                          
                          {!musician.isExcluded && willContact && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Får förfrågan
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center"><span className="text-green-600 mr-1">✓</span> Accepterat</span>
                      <span className="flex items-center"><span className="text-yellow-500 mr-1">⏱</span> Väntar svar</span>
                      <span className="flex items-center"><span className="text-red-500 mr-1">✗</span> Tackat nej</span>
                      <span className="flex items-center"><span className="text-green-600 mr-1">→</span> Får förfrågan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Musicians to contact */}
            {previewData.preview.musiciansToContact.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {previewData.strategy.type === 'sequential' 
                    ? 'Följande musiker kommer få förfrågan NU:' 
                    : 'Följande musiker kommer få förfrågan:'}
                </h4>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  {previewData.strategy.type === 'sequential' && (
                    <div className="flex items-center mb-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                        1
                      </div>
                      <span className="text-sm font-medium text-green-800">
                        Endast EN musiker kontaktas åt gången
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {previewData.preview.musiciansToContact.map((musician) => (
                      <div key={musician.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">
                          <span className="text-gray-500 mr-2">{musician.rank}.</span>
                          {musician.name}
                        </span>
                        <span className="text-gray-500">{musician.email}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    {previewData.strategy.type === 'sequential' 
                      ? 'Förfrågan skickas endast till denna musiker'
                      : `${previewData.preview.musiciansToContact.length} ${previewData.preview.musiciansToContact.length === 1 ? 'förfrågan' : 'förfrågningar'} kommer skickas`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  {previewData.need.currentStatus.pending > 0 
                    ? 'Väntar fortfarande på svar från tidigare förfrågningar. Inga nya förfrågningar skickas just nu.'
                    : 'Inga tillgängliga musiker att skicka förfrågningar till.'}
                </p>
              </div>
            )}

            {/* Next in queue */}
            {previewData.preview.nextInQueue.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {previewData.strategy.type === 'sequential' 
                    ? 'Om musiker tackar nej, kontaktas:' 
                    : 'Nästa i kö (om någon tackar nej):'}
                </h4>
                <div className={`rounded-lg p-4 ${
                  previewData.strategy.type === 'sequential' 
                    ? 'bg-orange-50 border border-orange-200' 
                    : 'bg-gray-50'
                }`}>
                  {previewData.strategy.type === 'sequential' && (
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-xs font-medium text-orange-700">
                        Automatiskt vid avböjande
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {previewData.preview.nextInQueue.map((musician, idx) => (
                      <div key={musician.id} className="text-sm text-gray-700">
                        <span className="text-gray-500 mr-2">{musician.rank}.</span>
                        {musician.name}
                        {previewData.strategy.type === 'sequential' && idx === 0 && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Nästa
                          </span>
                        )}
                      </div>
                    ))}
                    {previewData.preview.totalAvailable > previewData.preview.nextInQueue.length && (
                      <p className="text-xs text-gray-500 italic mt-2">
                        ... och {previewData.preview.totalAvailable - previewData.preview.nextInQueue.length} till tillgängliga
                      </p>
                    )}
                  </div>
                </div>
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
              <span>{sending ? 'Skickar...' : 'Skicka förfrågningar'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}