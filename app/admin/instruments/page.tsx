'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReorderInstrumentsModal from '@/components/reorder-instruments-modal'

// Sortable position component
function SortablePosition({ 
  position, 
  onEdit 
}: { 
  position: Position
  onEdit: (positionId: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: position.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{position.name}</p>
          <p className="text-xs text-gray-500">
            Nivå {position.hierarchyLevel} • {position._count?.qualifications || 0} {position._count?.qualifications === 1 ? 'musiker' : 'musiker'}
          </p>
        </div>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-gray-600 hover:text-gray-900"
        onClick={() => onEdit(position.id)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  )
}

interface Position {
  id: number
  positionId: string
  name: string
  hierarchyLevel: number
  _count?: {
    qualifications: number
  }
}

interface Instrument {
  id: number
  instrumentId: string
  name: string
  displayOrder: number | null
  isArchived: boolean
  positions: Position[]
  totalUniqueMusicians?: number
  _count?: {
    positions: number
  }
}

export default function InstrumentsPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInstruments, setExpandedInstruments] = useState<Set<number>>(new Set())
  const [addingPosition, setAddingPosition] = useState<number | null>(null)
  const [newPositionName, setNewPositionName] = useState('')
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchInstruments()
  }, [])

  const fetchInstruments = async () => {
    try {
      const response = await fetch('/api/instruments')
      if (!response.ok) {
        console.error('Failed to fetch instruments:', response.status)
        setInstruments([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setInstruments(data)
      } else {
        console.error('Invalid response format:', data)
        setInstruments([])
      }
    } catch (error) {
      console.error('Failed to fetch instruments:', error)
      setInstruments([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (instrumentId: number) => {
    const newExpanded = new Set(expandedInstruments)
    if (newExpanded.has(instrumentId)) {
      newExpanded.delete(instrumentId)
    } else {
      newExpanded.add(instrumentId)
    }
    setExpandedInstruments(newExpanded)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent, instrumentId: number) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const instrument = instruments.find(i => i.id === instrumentId)
      if (!instrument) return
      
      const oldIndex = instrument.positions.findIndex((p) => p.id === active.id)
      const newIndex = instrument.positions.findIndex((p) => p.id === over?.id)
      
      const newPositions = arrayMove(instrument.positions, oldIndex, newIndex)
      
      // Update local state optimistically
      setInstruments(instruments.map(i => 
        i.id === instrumentId 
          ? { ...i, positions: newPositions.map((p, idx) => ({ ...p, hierarchyLevel: idx + 1 })) }
          : i
      ))
      
      // Save to database
      try {
        await fetch('/api/positions/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positions: newPositions.map((p, idx) => ({
              id: p.id,
              hierarchyLevel: idx + 1
            }))
          })
        })
      } catch (error) {
        console.error('Error saving position order:', error)
        // Revert on error
        fetchInstruments()
      }
    }
  }

  const handleAddPosition = async (instrumentId: number) => {
    if (!newPositionName.trim()) return
    
    try {
      const response = await fetch(`/api/instruments/${instrumentId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPositionName.trim(),
          hierarchyLevel: instruments.find(i => i.id === instrumentId)?.positions.length + 1 || 1
        })
      })
      
      if (response.ok) {
        setNewPositionName('')
        setAddingPosition(null)
        fetchInstruments()
      }
    } catch (error) {
      console.error('Error adding position:', error)
    }
  }


  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar instrument...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Instrument & Kvalifikationer</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowReorderModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Ändra ordning
            </button>
            <Link
              href="/admin/instruments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nytt instrument
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hantera orkesterns instrument och deras tjänster. Klicka på ett instrument för att se detaljer.
          </p>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            Visa arkiverade instrument
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {instruments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Inga instrument registrerade ännu</p>
            <Link
              href="/admin/instruments/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Lägg till första instrumentet
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {instruments
              .filter(instrument => showArchived || !instrument.isArchived)
              .map((instrument) => {
              const totalMusicians = instrument.totalUniqueMusicians || 0
              const isExpanded = expandedInstruments.has(instrument.id)
              
              return (
                <div key={instrument.id} className={`rounded-lg shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
                  instrument.isArchived ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <button
                          onClick={() => toggleExpand(instrument.id)}
                          className="mr-4 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg 
                            className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {instrument.name}
                            </h3>
                            {instrument.isArchived && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Arkiverad
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {instrument.positions.length} tjänster
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {totalMusicians} musiker
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/admin/instruments/${instrument.id}`}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          title="Redigera instrument"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            Tjänster/Kvalifikationer
                          </h4>
                          {addingPosition !== instrument.id ? (
                            <button
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
                              onClick={() => setAddingPosition(instrument.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Lägg till tjänst
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newPositionName}
                                onChange={(e) => setNewPositionName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddPosition(instrument.id)
                                  }
                                }}
                                placeholder="Tjänstnamn"
                                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddPosition(instrument.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setAddingPosition(null)
                                  setNewPositionName('')
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {instrument.positions.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Inga tjänster registrerade än
                          </p>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleDragEnd(event, instrument.id)}
                          >
                            <SortableContext
                              items={instrument.positions.map(p => p.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {instrument.positions
                                  .sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
                                  .map((position) => (
                                    <SortablePosition 
                                      key={position.id} 
                                      position={position} 
                                      onEdit={() => {
                                        // For now, redirect to edit page
                                        window.location.href = `/admin/instruments/${instrument.id}`
                                      }}
                                    />
                                  ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* Reorder Instruments Modal */}
      {showReorderModal && (
        <ReorderInstrumentsModal
          onClose={() => setShowReorderModal(false)}
          onSuccess={() => {
            setShowReorderModal(false)
            fetchInstruments()
          }}
        />
      )}
    </div>
  )
}