'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function SuccessModal({
  isOpen,
  onClose,
  title = 'Lyckades!',
  message,
  autoClose = true,
  autoCloseDelay = 3000
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-start justify-center z-50 pt-20 px-4 transition-opacity duration-200">
      <div className="bg-white rounded shadow-xl max-w-md w-full animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              {/* Green checkmark circle */}
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{message}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {autoClose && (
            <div className="mt-4">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{
                    animation: `grow ${autoCloseDelay}ms linear forwards`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Stängs automatiskt...</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes grow {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}