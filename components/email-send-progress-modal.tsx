'use client'

import { useEffect, useState } from 'react'
import { EmailRateLimiter } from '@/lib/email/rate-limiter'

interface EmailSendProgressModalProps {
  isOpen: boolean
  totalEmails: number
  onClose?: () => void
  mode?: 'instant' | 'small' | 'medium' | 'large'
}

export default function EmailSendProgressModal({
  isOpen,
  totalEmails,
  onClose,
  mode
}: EmailSendProgressModalProps) {
  const [progress, setProgress] = useState({
    sent: 0,
    total: totalEmails,
    currentBatch: [] as string[],
    estimatedTime: 0
  })

  useEffect(() => {
    if (isOpen && totalEmails > 0) {
      const estimatedTime = EmailRateLimiter.estimateTime(totalEmails)
      const processingMode = mode || EmailRateLimiter.getProcessingMode(totalEmails)
      
      setProgress(prev => ({
        ...prev,
        total: totalEmails,
        estimatedTime,
        mode: processingMode
      }))
    }
  }, [isOpen, totalEmails, mode])

  if (!isOpen) return null

  const percentage = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0
  const processingMode = mode || EmailRateLimiter.getProcessingMode(totalEmails)

  // Instant mode - just show sending message
  if (processingMode === 'instant') {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
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
            {progress.sent < progress.total ? (
              <>
                Beräknad tid kvar: {Math.ceil((progress.total - progress.sent) / 2)} sekunder
              </>
            ) : (
              <>
                Alla förfrågningar har skickats!
              </>
            )}
          </div>

          {/* Medium/Large mode - option to run in background */}
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
                {totalEmails} förfrågningar har lagts i kö för bakgrundsprocessning.
                Du får en notifikation när alla är skickade.
              </p>
            </div>
          )}

          {/* Close button (only when done or in background mode) */}
          {(progress.sent === progress.total || processingMode === 'large') && (
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