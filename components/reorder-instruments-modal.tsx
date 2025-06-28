'use client'

import { useState, useEffect } from 'react'
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

interface Instrument {
  id: number
  instrumentId: string
  name: string
  displayOrder: number
}

interface SortableInstrumentProps {
  instrument: Instrument
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableInstrument({ instrument, index, total, onMoveUp, onMoveDown }: SortableInstrumentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instrument.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors ${
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
          <p className="font-medium text-gray-900">{instrument.name}</p>
          <p className="text-sm text-gray-500">Position {index + 1}</p>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Flytta upp"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Flytta ner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ReorderInstrumentsModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function ReorderInstrumentsModal({ onClose, onSuccess }: ReorderInstrumentsModalProps) {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchInstruments()
  }, [])

  const fetchInstruments = async () => {
    try {
      const response = await fetch('/api/instruments')
      const data = await response.json()
      
      // Sort by displayOrder, handling null values
      const sortedInstruments = data
        .sort((a: Instrument, b: Instrument) => {
          const orderA = a.displayOrder ?? 999
          const orderB = b.displayOrder ?? 999
          return orderA - orderB
        })
        .map((instrument: Instrument, index: number) => ({
          ...instrument,
          displayOrder: index + 1
        }))
      
      setInstruments(sortedInstruments)
    } catch (error) {
      console.error('Error fetching instruments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = instruments.findIndex((i) => i.id === active.id)
      const newIndex = instruments.findIndex((i) => i.id === over?.id)
      
      const newInstruments = arrayMove(instruments, oldIndex, newIndex)
        .map((instrument, index) => ({
          ...instrument,
          displayOrder: index + 1
        }))
      
      setInstruments(newInstruments)
    }
  }

  const moveInstrument = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= instruments.length) return
    
    const newInstruments = arrayMove(instruments, fromIndex, toIndex)
      .map((instrument, index) => ({
        ...instrument,
        displayOrder: index + 1
      }))
    
    setInstruments(newInstruments)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/instruments/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruments: instruments.map(i => ({
            id: i.id,
            displayOrder: i.displayOrder
          }))
        })
      })
      
      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        console.error('Failed to save instrument order')
      }
    } catch (error) {
      console.error('Error saving instrument order:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const resetInstruments = [...instruments]
      .sort((a, b) => a.id - b.id)
      .map((instrument, index) => ({
        ...instrument,
        displayOrder: index + 1
      }))
    setInstruments(resetInstruments)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Ändra instrumentordning</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Dra och släpp instrumenten för att ändra ordningen. Denna ordning kommer att användas överallt i systemet.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Laddar instrument...</p>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={instruments.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {instruments.map((instrument, index) => (
                      <SortableInstrument 
                        key={instrument.id} 
                        instrument={instrument}
                        index={index}
                        total={instruments.length}
                        onMoveUp={() => moveInstrument(index, index - 1)}
                        onMoveDown={() => moveInstrument(index, index + 1)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Återställ ordning
                </button>
                <div className="space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {saving ? 'Sparar...' : 'Spara ordning'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}