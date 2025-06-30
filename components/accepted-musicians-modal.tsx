'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface AcceptedMusician {
  musician: Musician
  position: {
    id: number
    name: string
    hierarchy?: number
    instrument: {
      id: number
      name: string
      displayOrder?: number
    }
  }
}

interface AcceptedMusiciansModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export default function AcceptedMusiciansModal({
  isOpen,
  onClose,
  projectId,
  projectName
}: AcceptedMusiciansModalProps) {
  const [musicians, setMusicians] = useState<AcceptedMusician[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchAcceptedMusicians()
    }
  }, [isOpen, projectId])

  const fetchAcceptedMusicians = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/accepted-musicians`)
      if (response.ok) {
        const data = await response.json()
        setMusicians(data)
      }
    } catch (error) {
      console.error('Failed to fetch accepted musicians:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Gruppera och sortera musiker efter instrument och position
  const groupedAndSortedMusicians = musicians
    .sort((a, b) => {
      // Först sortera efter instrument displayOrder
      const orderA = a.position.instrument.displayOrder ?? 999
      const orderB = b.position.instrument.displayOrder ?? 999
      if (orderA !== orderB) return orderA - orderB
      
      // Sedan efter position hierarchy
      const hierarchyA = a.position.hierarchy ?? 999
      const hierarchyB = b.position.hierarchy ?? 999
      return hierarchyA - hierarchyB
    })


  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-start justify-center z-50 pt-20 px-4">
      <div className="bg-white rounded shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline space-x-4">
              <h2 className="text-lg font-medium text-gray-900">Accepterade musiker</h2>
              <span className="text-sm text-gray-500">Uppdateras automatiskt</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                <p className="text-gray-600">Laddar musiker...</p>
              </div>
            </div>
          ) : musicians.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">Inga musiker har tackat ja ännu.</p>
            </div>
          ) : (
            <div>
              <div className="px-6 pt-4 pb-2">
                <p className="text-sm text-gray-600 mb-4">Accepterade musiker ({musicians.length})</p>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left pb-3 pr-8">INSTRUMENT</th>
                      <th className="text-left pb-3">MUSIKER</th>
                      <th className="text-left pb-3">POSITION</th>
                      <th className="text-left pb-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedAndSortedMusicians.map((item, index) => {
                      const prevItem = index > 0 ? groupedAndSortedMusicians[index - 1] : null
                      const isNewInstrument = !prevItem || prevItem.position.instrument.id !== item.position.instrument.id
                      const isLastInGroup = index === groupedAndSortedMusicians.length - 1 || 
                        groupedAndSortedMusicians[index + 1].position.instrument.id !== item.position.instrument.id
                      
                      return (
                        <tr key={`${item.musician.id}-${item.position.id}`} 
                            className={`hover:bg-gray-50 ${isLastInGroup ? 'border-b border-gray-200' : ''}`}>
                          <td className={`py-3 pr-8 text-sm text-gray-700 font-medium ${isNewInstrument ? 'pt-5' : ''}`}>
                            {isNewInstrument ? item.position.instrument.name : ''}
                          </td>
                          <td className={`py-3 text-sm text-gray-900 ${isNewInstrument ? 'pt-5' : ''}`}>
                            {item.musician.firstName} {item.musician.lastName}
                          </td>
                          <td className={`py-3 text-sm text-gray-600 ${isNewInstrument ? 'pt-5' : ''}`}>
                            {item.position.name}
                          </td>
                          <td className={`py-3 ${isNewInstrument ? 'pt-5' : ''}`}>
                            <span className="text-sm text-green-600 font-medium">Accepterad</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}