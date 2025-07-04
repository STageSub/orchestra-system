'use client'

import { useState, useEffect, useRef } from 'react'
import { EmailRateLimiter } from '@/lib/email/rate-limiter'

interface ProgressData {
  total: number
  sent: number
  currentBatch: string[]
  estimatedTime: number
  status: 'sending' | 'completed' | 'error' | 'idle'
  error?: string
}

interface EmailSendProgressModalProps {
  projectId: string
  sessionId: string
  volume: number
  isOpen: boolean
  onClose: () => void
}

export default function EmailSendProgressModal({
  projectId,
  sessionId,
  volume,
  isOpen,
  onClose
}: EmailSendProgressModalProps) {
  const [progress, setProgress] = useState<ProgressData>({
    total: volume,
    sent: 0,
    currentBatch: [],
    estimatedTime: Math.ceil(volume / 2),
    status: 'sending'
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const processingMode = EmailRateLimiter.getProcessingMode(volume)
  const percentage = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0

  // Poll for progress updates
  useEffect(() => {
    if (!isOpen || !sessionId) return
    
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/send-progress?sessionId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.status !== 'idle') {
            setProgress({
              total: data.total || volume,
              sent: data.sent || 0,
              currentBatch: data.currentBatch || [],
              estimatedTime: data.estimatedTime || 0,
              status: data.status || 'sending',
              error: data.error
            })
            
            // Stop polling if completed or error
            if (data.status === 'completed' || data.status === 'error') {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error)
      }
    }
    
    // Initial fetch
    fetchProgress()
    
    // Set up polling interval (every 500ms for smooth updates)
    intervalRef.current = setInterval(fetchProgress, 500)
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isOpen, projectId, sessionId, volume])

  if (!isOpen) return null

  // Error state
  if (progress.status === 'error') {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Ett fel uppstod</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{progress.error || 'Ett fel uppstod vid utskick av förfrågningar'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Stäng
          </button>
        </div>
      </div>
    )
  }

  // Instant mode - just a simple spinner
  if (processingMode === 'instant') {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Skickar förfrågningar...</span>
          </div>
        </div>
      </div>
    )
  }

  // Small/Medium/Large modes - show detailed progress
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Skickar förfrågningar
          </h3>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.sent} av {progress.total}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Current batch */}
          {progress.currentBatch.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Skickar till:</p>
              <p className="text-sm font-medium text-gray-900">
                {progress.currentBatch.join(', ')}
              </p>
            </div>
          )}

          {/* Time estimate */}
          <div className="text-sm text-gray-600">
            {progress.status === 'completed' ? (
              <>
                ✅ Alla förfrågningar har skickats!
              </>
            ) : (
              <>
                Beräknad tid kvar: {Math.ceil((progress.total - progress.sent) / 2)} sekunder
              </>
            )}
          </div>

          {/* Medium mode - option to run in background */}
          {processingMode === 'medium' && progress.sent === 0 && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                Detta kommer ta cirka {progress.estimatedTime} sekunder.
              </p>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Vänta
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                  onClick={() => {
                    // TODO: Implement background processing
                    alert('Bakgrundsprocessning kommer snart!')
                  }}
                >
                  Kör i bakgrunden
                </button>
              </div>
            </div>
          )}

          {/* Large mode - automatic background processing */}
          {processingMode === 'large' && (
            <div className="mt-6 bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                {volume} förfrågningar har lagts i kö för bakgrundsprocessning.
                Du får en notifikation när alla är skickade.
              </p>
            </div>
          )}

          {/* Close button (only when done or in background mode) */}
          {(progress.status === 'completed' || processingMode === 'large') && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Stäng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}