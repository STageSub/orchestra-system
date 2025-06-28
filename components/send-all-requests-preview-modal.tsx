'use client'

import { useState, useEffect } from 'react'
import Tooltip from './tooltip'

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
  musiciansToContact: Array<{
    id: number
    name: string
    email: string
    rank: number
  }>
  nextInQueue?: Array<{
    id: number
    name: string
    email: string
    rank: number
  }>
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

  useEffect(() => {
    if (isOpen) {
      fetchPreview()
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

  if (!isOpen) return null

  const getStrategyLabel = (type: string) => {
    switch (type) {
      case 'sequential': return 'Sekventiell'
      case 'parallel': return 'Parallell'
      case 'first_come': return 'Först till kvarn'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
                            <span>{getStrategyLabel(need.strategy)}</span>
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